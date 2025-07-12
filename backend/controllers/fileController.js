const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const mime = require('mime-types');
const sharp = require('sharp');
const Busboy = require('busboy');
const { filesize } = require('filesize');
require('dotenv').config();

const Queue = require('bull');
const thumbnailQueue = new Queue('thumbnails', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  }
});

const baseDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../..', 'uploads'));

const getFolderFiles = async (req, res) => {
  const baseDirUser = ensureUserUploadDir(req.user.id);
  // Normalize path: strip any leading slashes so '/' refers to baseDirUser
  let relativePath = req.query.path || '';
  relativePath = relativePath.replace(/^\/+/, '');
  const targetPath = path.resolve(baseDirUser, relativePath);
  if (!targetPath.startsWith(baseDirUser + path.sep) && targetPath !== baseDirUser) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  try {
    await fsp.access(targetPath);
  } catch {
    return res.json({ children: [] });
  }

  try {
    const items = await fsp.readdir(targetPath, { withFileTypes: true });
    const children = await Promise.all(
      items.map(async item => {
        const fullPath = path.join(targetPath, item.name);
        const stats = await fsp.stat(fullPath);
        const isFile = item.isFile();
        return {
          name: item.name,
          path: path.relative(baseDirUser, fullPath),
          type: item.isDirectory() ? 'folder' : 'file',
          size: isFile
            ? filesize(stats.size)
            : filesize(getFolderSize(fullPath)),
          updated: `${String(stats.mtime.getDate()).padStart(2, '0')}.${String(
            stats.mtime.getMonth() + 1
          ).padStart(2, '0')}.${stats.mtime.getFullYear()}`
        };
      })
    );

    res.json({ children });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read directory' });
  }
};

const getFolderSizeRoute = (req, res) => {
  const baseDirUser = ensureUserUploadDir(req.user.id);
  // Normalize path: strip any leading slashes
  let relativePath = req.query.path || '';
  relativePath = relativePath.replace(/^\/+/, '');
  const targetPath = path.resolve(baseDirUser, relativePath);
  if (!targetPath.startsWith(baseDirUser + path.sep) && targetPath !== baseDirUser) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  try {
    const totalSize = getFolderSize(targetPath);
    res.json({ size: filesize(totalSize) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate folder size' });
  }
};

const getTotalUserUploadSize = (req, res) => {
  const baseDirUser = ensureUserUploadDir(req.user.id);

  try {
    const totalSize = getFolderSize(baseDirUser);
    res.json({ size: filesize(totalSize) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate total user upload size' });
  }
};

const generateVideoThumbnail = (req, res) => {
  const filename = req.params.filename;
  const baseDirUser = ensureUserUploadDir(req.user.id);
  const filePath = path.resolve(baseDirUser, filename);
  if (!filePath.startsWith(baseDirUser + path.sep)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  const thumbsDir = path.join(baseDirUser, 'thumbs');
  const thumbPath = path.join(thumbsDir, `${filename}.jpg`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Video file not found' });
  }

  if (fs.existsSync(thumbPath)) {
    return res.sendFile(thumbPath);
  }

  // Thumb generieren
  if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir);

  ffmpeg(filePath)
    .on('end', () => {
      res.sendFile(thumbPath);
    })
    .on('error', (err) => {
      console.error('FFmpeg error:', err.message);
      res.status(500).json({ error: 'Thumbnail generation failed' });
    })
    .screenshots({
      timestamps: ['1'],
      filename: `${filename}.jpg`,
      folder: thumbsDir,
      size: '320x240'
    });
};

const generateImageThumbnail = async (req, res) => {
  const filename = req.params.filename;
  const baseDirUser = ensureUserUploadDir(req.user.id);
  const filePath = path.resolve(baseDirUser, filename);
  if (!filePath.startsWith(baseDirUser + path.sep)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  const thumbsDir = path.join(baseDirUser, 'thumbs');
  const thumbPath = path.join(thumbsDir, `${filename}.jpg`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Image file not found' });
  }

  if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir);

  if (!fs.existsSync(thumbPath)) {
    try {
      await sharp(filePath)
        .resize(200, 200, { fit: 'cover' })
        .toFile(thumbPath);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Thumbnail creation failed' });
    }
  }

  res.sendFile(thumbPath);
};

const previewFile = (req, res) => {
  const baseDirUser = ensureUserUploadDir(req.user.id);
  const filePath = path.resolve(baseDirUser, req.params.filename);
  if (!filePath.startsWith(baseDirUser + path.sep)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const mimeType = mime.lookup(filePath) || '';

  // Text und Bilder direkt anzeigen, andere ggf. ablehnen oder herunterladen
  const previewable = ['image/', 'text/', 'application/pdf'];

  if (!previewable.some(type => mimeType.startsWith(type))) {
    return res.status(415).json({ error: 'Preview not supported for this file type' });
  }

  res.setHeader('Content-Type', mimeType);
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
};

const deleteFileOrFolder = (req, res) => {
  const baseDirUser = ensureUserUploadDir(req.user.id);
  const targetPath = path.resolve(baseDirUser, req.params.filename);
  if (!targetPath.startsWith(baseDirUser + path.sep)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  if (!fs.existsSync(targetPath)) {
    return res.status(404).json({ error: 'File or folder not found' });
  }

  try {
    const stats = fs.statSync(targetPath);

    if (stats.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetPath);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Deletion failed' });
  }
};

const handleUpload = (req, res) => {
  const baseDirUser = ensureUserUploadDir(req.user.id);
  const busboy = Busboy({ headers: req.headers });

  const pathMap = {};
  const uploads = [];

  busboy.on('field', (fieldname, val) => {
    if (fieldname.startsWith('relativePath:') && typeof val === 'string') {
      const fileId = fieldname.split(':')[1];
      pathMap[fileId] = val;
    }
  });

  busboy.on('file', (fieldname, file, filename) => {
    const cleanPath = pathMap[fieldname] || filename;

    if (typeof cleanPath !== 'string') {
      console.warn('Rejected non-string cleanPath:', cleanPath);
      return res.status(400).json({ error: 'Invalid file path' });
    }

    const sanitizedPath = path.normalize(cleanPath);
    const targetPath = path.resolve(baseDirUser, sanitizedPath);
    if (!targetPath.startsWith(baseDirUser + path.sep)) {
      return res.status(400).json({ error: 'Invalid path' });
    }
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let finalPath = targetPath;
    let count = 1;
    while (fs.existsSync(finalPath)) {
      const parsed = path.parse(targetPath);
      finalPath = path.join(parsed.dir, `${parsed.name} (${count++})${parsed.ext}`);
    }
    const writeStream = fs.createWriteStream(finalPath);
    file.pipe(writeStream);

    const uploadPromise = new Promise((resolve, reject) => {
      writeStream.on('close', () => {
        const mimeType = mime.lookup(finalPath) || '';
        if (mimeType.startsWith('image/')) {
          thumbnailQueue.add({ filePath: finalPath, type: 'image' });
        } else if (mimeType.startsWith('video/')) {
          thumbnailQueue.add({ filePath: finalPath, type: 'video' });
        }
        resolve();
      });
      writeStream.on('error', reject);
    });

    uploads.push(uploadPromise);
  });

  busboy.on('finish', async () => {
    try {
      await Promise.all(uploads);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('❌ Fehler beim Schreiben:', err);
      res.status(500).json({ error: 'Upload fehlgeschlagen' });
    }
  });

  req.pipe(busboy);
};

module.exports = {
  getFolderFiles,
  getFolderSizeRoute,
  getTotalUserUploadSize,
  previewFile,
  generateVideoThumbnail,
  generateImageThumbnail,
  deleteFileOrFolder,
  handleUpload
};

function getFolderSize(dirPath) {
  let totalSize = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    const stats = fs.statSync(entryPath);

    if (entry.isFile()) {
      totalSize += stats.size;
    } else if (entry.isDirectory()) {
      totalSize += getFolderSize(entryPath);
    }
  }

  return totalSize;
}

function ensureUserUploadDir(userId) {
  const userDir = path.join(baseDir, userId.toString());
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}
const fs = require('fs');
const path = require('path');
const { filesize } = require('filesize');
const mime = require('mime');
const sharp = require('sharp');
require('dotenv').config();

const baseDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../..', 'uploads'));

const getFolderFiles = (req, res) => {
  const baseDirUser = ensureUserUploadDir(req.user.id);
  const relativePath = req.query.path || '';
  const targetPath = path.join(baseDirUser, relativePath);

  try {
    if (!fs.existsSync(targetPath)) return res.json({ children: [] });

    const items = fs.readdirSync(targetPath, { withFileTypes: true });
    const children = items.map(item => {
      const fullPath = path.join(targetPath, item.name);
      const stats = fs.statSync(fullPath);
      return {
        name: item.name,
        path: path.relative(baseDirUser, path.join(targetPath, item.name)),
        type: item.isDirectory() ? 'folder' : 'file',
        size: item.isFile()
          ? filesize(stats.size)
          : filesize(getFolderSize(fullPath)),
        updated: `${String(stats.mtime.getDate()).padStart(2, '0')}.${String(stats.mtime.getMonth() + 1).padStart(2, '0')}.${stats.mtime.getFullYear()}`
      };
    });

    res.json({ children });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read directory' });
  }
};

const getFolderSizeRoute = (req, res) => {
  const baseDirUser = ensureUserUploadDir(req.user.id);
  const relativePath = req.query.path || '';
  const targetPath = path.join(baseDirUser, relativePath);

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
  const filePath = path.join(baseDirUser, filename);
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
  const filePath = path.join(baseDirUser, filename);
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
  const filePath = path.join(baseDirUser, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const mimeType = mime.getType(filePath);

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
  const targetPath = path.join(baseDirUser, req.params.filename);

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

const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const handleUpload = async (req, res) => {
  const baseDirUser = ensureUserUploadDir(req.user.id);
  const files = req.files;
  // read paths from body (may be string or array)
  let paths = req.body.paths || req.body['paths[]'];
  if (!paths) {
    console.warn('Warning: paths[] missing from request');
    paths = [];
  } else if (!Array.isArray(paths)) {
    paths = [paths]; // force to array
  }

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = paths[i] || file.originalname;
      const fullPath = path.join(baseDirUser, relativePath);

      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, file.buffer);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
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
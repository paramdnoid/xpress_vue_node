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

const handleChunkUpload = async (req, res) => {
  try {
    const baseDirUser = ensureUserUploadDir(req.user.id);
    const chunksDir = path.join(baseDir, 'chunks');
    fs.mkdirSync(chunksDir, { recursive: true });

    const chunkIndex = parseInt(req.body.chunkIndex);
    const totalChunks = parseInt(req.body.totalChunks);
    const relPath = req.body.relativePath;
    const originalName = req.body.originalName || (relPath ? path.basename(relPath) : req.file.originalname);

    if (!req.file) {
      return res.status(400).json({ error: 'Chunk-Datei fehlt' });
    }

    const chunkFilename = `${originalName}.${chunkIndex}.part`;
    const chunkPath = path.join(chunksDir, chunkFilename);

    // Move uploaded chunk to chunks dir
    fs.renameSync(req.file.path, chunkPath);

    // Wenn letzter Chunk, Datei zusammensetzen
    if (chunkIndex + 1 === totalChunks) {
      // Prüfen, ob alle Chunk-Dateien existieren
      for (let i = 0; i < totalChunks; i++) {
        const partPath = path.join(chunksDir, `${originalName}.${i}.part`);
        if (!fs.existsSync(partPath)) {
          return res.status(400).json({
            error: `Chunk-Datei fehlt: ${originalName}.${i}.part`
          });
        }
      }

      const finalPath = path.join(baseDirUser, relPath || originalName);
      const finalDir = path.dirname(finalPath);
      if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });

      const writeStream = fs.createWriteStream(finalPath);

      for (let i = 0; i < totalChunks; i++) {
        const partPath = path.join(chunksDir, `${originalName}.${i}.part`);
        await new Promise((resolve, reject) => {
          const read = fs.createReadStream(partPath);
          read.pipe(writeStream, { end: false });
          read.on('end', resolve);
          read.on('error', reject);
        });
        fs.unlinkSync(partPath);
      }
      writeStream.end();

      return res.status(200).json({ success: true, message: 'Datei erfolgreich zusammengefügt!' });
    } else {
      return res.status(200).json({ success: true, message: `Chunk ${chunkIndex + 1}/${totalChunks} gespeichert` });
    }
  } catch (err) {
    console.error('❌ Chunk-Upload-Fehler:', err);
    return res.status(500).json({ error: 'Chunk-Upload fehlgeschlagen' });
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
  handleChunkUpload
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
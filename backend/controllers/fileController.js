// /backend/controllers/fileController.js
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const mime = require('mime-types');
const sharp = require('sharp');
const { filesize } = require('filesize');
require('dotenv').config();

const baseDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../..', 'uploads'));
const MAX_PARALLEL_STATS = 20;

async function parallelMap(array, limit, asyncFn) {
  const ret = [];
  let idx = 0;
  async function next() {
    if (idx >= array.length) return;
    const i = idx++;
    ret[i] = asyncFn(array[i], i, array);
    await ret[i];
    return next();
  }
  const pool = [];
  for (let i = 0; i < Math.min(limit, array.length); i++) pool.push(next());
  await Promise.all(pool);
  return Promise.all(ret);
}

// --- Get folder listing (ultra-fast, non-blocking, no folder sizes here) ---
const getFolderFiles = async (req, res) => {
  const baseDirUser = ensureUserUploadDir(req.user.id);
  let relativePath = (req.query.path || '').replace(/^\/+/, '');
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
    const children = await parallelMap(items, MAX_PARALLEL_STATS, async item => {
      const fullPath = path.join(targetPath, item.name);
      const stats = await fsp.stat(fullPath);
      const isFile = item.isFile();
      return {
        name: item.name,
        path: path.relative(baseDirUser, fullPath),
        type: item.isDirectory() ? 'folder' : 'file',
        size: isFile ? filesize(stats.size) : null, // Folder size nur auf Anfrage!
        updated: `${String(stats.mtime.getDate()).padStart(2, '0')}.${String(
          stats.mtime.getMonth() + 1
        ).padStart(2, '0')}.${stats.mtime.getFullYear()}`
      };
    });

    res.json({ children });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read directory' });
  }
};

// --- Async folder size (recursive, pooled, numeric) ---
async function getFolderSizeAsync(dirPath) {
  let totalSize = 0;
  let entries;
  try {
    entries = await fsp.readdir(dirPath, { withFileTypes: true });
  } catch {
    return 0;
  }
  await parallelMap(entries, MAX_PARALLEL_STATS, async entry => {
    const entryPath = path.join(dirPath, entry.name);
    const stats = await fsp.stat(entryPath);
    if (entry.isFile()) {
      totalSize += stats.size;
    } else if (entry.isDirectory()) {
      totalSize += await getFolderSizeAsync(entryPath);
    }
  });
  return totalSize;
}

const getFolderSizeRoute = async (req, res) => {
  const baseDirUser = ensureUserUploadDir(req.user.id);
  let relativePath = (req.query.path || '').replace(/^\/+/, '');
  const targetPath = path.resolve(baseDirUser, relativePath);
  if (!targetPath.startsWith(baseDirUser + path.sep) && targetPath !== baseDirUser) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  try {
    const totalSize = await getFolderSizeAsync(targetPath);
    res.json({ size: totalSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate folder size' });
  }
};

const getTotalUserUploadSize = async (req, res) => {
  const baseDirUser = ensureUserUploadDir(req.user.id);
  try {
    const totalSize = await getFolderSizeAsync(baseDirUser);
    res.json({ size: totalSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate total user upload size' });
  }
};

// --- Non-blocking async thumbnail creation ---
const generateImageThumbnail = async (req, res) => {
  const filename = req.params.filename;
  const baseDirUser = ensureUserUploadDir(req.user.id);
  const filePath = path.resolve(baseDirUser, filename);
  if (!filePath.startsWith(baseDirUser + path.sep)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  const thumbsDir = path.join(baseDirUser, 'thumbs');
  const thumbPath = path.join(thumbsDir, `${filename}.jpg`);

  try {
    await fsp.stat(filePath);
    try { await fsp.stat(thumbsDir); } catch { await fsp.mkdir(thumbsDir); }
    try { await fsp.stat(thumbPath); }
    catch {
      await sharp(filePath)
        .resize(200, 200, { fit: 'cover' })
        .toFile(thumbPath);
    }
    res.sendFile(thumbPath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Thumbnail creation failed or file not found' });
  }
};

// --- File preview (unchanged, still fast) ---
const previewFile = async (req, res) => {
  const baseDirUser = ensureUserUploadDir(req.user.id);
  const filePath = path.resolve(baseDirUser, req.params.filename);
  if (!filePath.startsWith(baseDirUser + path.sep)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  try {
    await fsp.stat(filePath);
  } catch {
    return res.status(404).json({ error: 'File not found' });
  }

  const mimeType = mime.lookup(filePath) || '';
  const previewable = ['image/', 'text/', 'application/pdf'];
  if (!previewable.some(type => mimeType.startsWith(type))) {
    return res.status(415).json({ error: 'Preview not supported for this file type' });
  }

  res.setHeader('Content-Type', mimeType);
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
};

// --- Async delete (never blocks event loop) ---
const deleteFileOrFolder = async (req, res) => {
  const baseDirUser = ensureUserUploadDir(req.user.id);
  const targetPath = path.resolve(baseDirUser, req.params.filename);
  if (!targetPath.startsWith(baseDirUser + path.sep)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  try {
    const stats = await fsp.stat(targetPath);
    if (stats.isDirectory()) await fsp.rm(targetPath, { recursive: true, force: true });
    else await fsp.unlink(targetPath);
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ENOENT')
      return res.status(404).json({ error: 'File or folder not found' });
    console.error(err);
    res.status(500).json({ error: 'Deletion failed' });
  }
};

// --- Ultra-fast chunk handler, async, never blocks ---
const handleChunkUpload = async (req, res) => {
  try {
    const baseDirUser = ensureUserUploadDir(req.user.id);
    const chunksDir = path.join(baseDir, 'chunks');
    await fsp.mkdir(chunksDir, { recursive: true });

    const chunkIndex = parseInt(req.body.chunkIndex);
    const totalChunks = parseInt(req.body.totalChunks);
    const relPath = req.body.relativePath;
    const originalName = req.body.originalName || (relPath ? path.basename(relPath) : req.file.originalname);

    if (!req.file) {
      return res.status(400).json({ error: 'Chunk-Datei fehlt' });
    }

    const chunkFilename = `${originalName}.${chunkIndex}.part`;
    const chunkPath = path.join(chunksDir, chunkFilename);

    await fsp.rename(req.file.path, chunkPath);

    // Wenn letzter Chunk, Datei zusammensetzen
    if (chunkIndex + 1 === totalChunks) {
      for (let i = 0; i < totalChunks; i++) {
        if (!fs.existsSync(path.join(chunksDir, `${originalName}.${i}.part`))) {
          return res.status(400).json({
            error: `Chunk-Datei fehlt: ${originalName}.${i}.part`
          });
        }
      }

      const finalPath = path.join(baseDirUser, relPath || originalName);
      const finalDir = path.dirname(finalPath);
      await fsp.mkdir(finalDir, { recursive: true });
      const writeStream = fs.createWriteStream(finalPath);

      for (let i = 0; i < totalChunks; i++) {
        await new Promise((resolve, reject) => {
          const partPath = path.join(chunksDir, `${originalName}.${i}.part`);
          const readStream = fs.createReadStream(partPath);
          readStream.on('error', reject);
          writeStream.on('error', reject);
          readStream.on('end', async () => {
            try {
              await fsp.unlink(partPath);
              resolve();
            } catch (err) {
              reject(err);
            }
          });
          readStream.pipe(writeStream, { end: false });
        });
      }

      writeStream.end();
      writeStream.on('finish', () => {
        console.debug(`⏱️ Zusammenbau abgeschlossen`);
      });

      return res.status(200).json({ success: true, message: 'Datei erfolgreich zusammengefügt!' });
    } else {
      return res.status(200).json({ success: true, message: `Chunk ${chunkIndex + 1}/${totalChunks} gespeichert` });
    }
  } catch (err) {
    console.error('❌ Chunk-Upload-Fehler:', err);
    return res.status(500).json({ error: 'Chunk-Upload fehlgeschlagen' });
  }
};

// --- Hilfsfunktionen ---
function ensureUserUploadDir(userId) {
  const userDir = path.join(baseDir, userId.toString());
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

// --- Export ---
module.exports = {
  getFolderFiles,
  getFolderSizeRoute,
  getTotalUserUploadSize,
  previewFile,
  generateImageThumbnail,
  deleteFileOrFolder,
  handleChunkUpload
};
const fs = require('fs');
const path = require('path');
const { filesize } = require('filesize');
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
        updated: stats.mtime.toLocaleString('de-DE')
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

module.exports = { getFolderFiles, getFolderSizeRoute, getTotalUserUploadSize };

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
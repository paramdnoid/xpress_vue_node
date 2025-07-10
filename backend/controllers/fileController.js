const fs = require('fs');
const path = require('path');
require('dotenv').config();

const baseDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../..', 'uploads'));

const getFolderFiles = (req, res) => {
  const baseDirUser = ensureUserUploadDir(req.user.id);
  const relativePath = req.query.path || '';
  const targetPath = path.join(baseDirUser, relativePath);

  try {
    if (!fs.existsSync(targetPath)) return res.json({ children: [] });

    const items = fs.readdirSync(targetPath, { withFileTypes: true });
    const children = items.map(item => ({
      name: item.name,
      path: path.relative(baseDirUser, path.join(targetPath, item.name)),
      type: item.isDirectory() ? 'folder' : 'file'
    }));

    res.json({ children });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read directory' });
  }
};

function ensureUserUploadDir(userId) {
  const userDir = path.join(baseDir, userId.toString());
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

module.exports = { getFolderFiles };

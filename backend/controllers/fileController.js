const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '../..', 'uploads');

const getFolderFiles = (req, res) => {
  const baseDirUser = path.join(baseDir, req.user.id.toString());
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

module.exports = { getFolderFiles };

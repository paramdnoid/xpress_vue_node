const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../../uploads');

const listFiles = (req, res) => {
  const userDir = path.join(uploadDir, req.user.id.toString());
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

  const files = fs.readdirSync(userDir).map(name => {
    const stats = fs.statSync(path.join(userDir, name));
    return {
      name,
      isDirectory: stats.isDirectory(),
      size: stats.size,
      created: stats.birthtime
    };
  });

  res.json(files);
};

const uploadFile = (req, res) => {
  const userDir = path.join(uploadDir, req.user.id.toString());
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

  for (const file of req.files) {
    const dest = path.join(userDir, file.originalname);
    fs.renameSync(file.path, dest);
  }
  res.json({ uploaded: req.files.length });
};

const downloadFile = (req, res) => {
  const filePath = path.join(uploadDir, req.user.id.toString(), req.query.name);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  res.download(filePath);
};

const deleteFile = (req, res) => {
  const filePath = path.join(uploadDir, req.user.id.toString(), req.params.id);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  fs.unlinkSync(filePath);
  res.json({ deleted: req.params.id });
};

const createFolder = (req, res) => {
  const folderPath = path.join(uploadDir, req.user.id.toString(), req.body.name);
  fs.mkdirSync(folderPath, { recursive: true });
  res.json({ created: req.body.name });
};

module.exports = { listFiles, uploadFile, downloadFile, deleteFile, createFolder };

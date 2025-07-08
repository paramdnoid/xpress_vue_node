const fs = require('fs');
const path = require('path');
const readDirectoryRecursive = require('../utils/readDirectoryRecursive');

const listFiles = (req, res) => {
  const baseDir = path.join(__dirname, '../..', 'uploads', req.user.id.toString()); // Adjust as needed

  try {
    const data = readDirectoryRecursive(baseDir);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read directory' });
  }
};

const uploadFile = (req, res) => {
  const userDir = path.join(baseDir, req.user.id.toString());
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

  for (const file of req.files) {
    const dest = path.join(userDir, file.originalname);
    fs.renameSync(file.path, dest);
  }
  res.json({ uploaded: req.files.length });
};

const downloadFile = (req, res) => {
  const filePath = path.join(baseDir, req.user.id.toString(), req.query.name);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  res.download(filePath);
};

const deleteFile = (req, res) => {
  const filePath = path.join(baseDir, req.user.id.toString(), req.params.id);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  fs.unlinkSync(filePath);
  res.json({ deleted: req.params.id });
};

const createFolder = (req, res) => {
  const folderPath = path.join(baseDir, req.user.id.toString(), req.body.name);
  fs.mkdirSync(folderPath, { recursive: true });
  res.json({ created: req.body.name });
};

module.exports = { listFiles, uploadFile, downloadFile, deleteFile, createFolder };

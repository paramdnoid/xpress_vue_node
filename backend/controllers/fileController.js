const fs = require('fs');
const path = require('path');
const readDirectoryRecursive = require('../utils/readDirectoryRecursive');

const baseDir = path.join(__dirname, '../..', 'uploads');

const listFolders = (req, res) => {
  const baseDirUser = path.join(baseDir, req.user.id.toString()); // Adjust as needed

  try {
    const data = readDirectoryRecursive(baseDirUser);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read directory' });
  }
};

const listFolderFiles = (req, res) => {
  const userDir = path.join(baseDir, req.user.id.toString());
  const targetDir = path.join(userDir, req.query.path || '');

  try {
    const data = readDirectoryRecursive(targetDir, false); // false = nicht rekursiv
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read directory' });
  }
};

const uploadFile = (req, res) => {
  const userDir = path.join(baseDir, req.user.id.toString());
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const uploadPath = path.join(userDir, req.body.path || file.originalname);
  const uploadDir = path.dirname(uploadPath);
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.renameSync(file.path, uploadPath);

  res.json({ uploaded: true });
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

module.exports = { listFolders, uploadFile, downloadFile, deleteFile, createFolder, listFolderFiles };

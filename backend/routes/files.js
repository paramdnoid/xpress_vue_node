const express = require('express');
const router = express.Router();
const { listFolders, uploadFile, downloadFile, deleteFile, createFolder } = require('../controllers/fileController');
const multer = require('multer');

const upload = multer({ dest: '../uploads/tmp' })

router.get('/', listFolders);
router.post('/upload', upload.single('file'), uploadFile);
router.get('/download', downloadFile);
router.delete('/:id', deleteFile);
router.post('/folder', createFolder);

module.exports = router;

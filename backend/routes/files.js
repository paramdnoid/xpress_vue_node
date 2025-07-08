const express = require('express');
const router = express.Router();
const { listFiles, uploadFile, downloadFile, deleteFile, createFolder } = require('../controllers/fileController');
const multer = require('multer');
const upload = multer({ dest: '../uploads/' });

router.get('/', listFiles);
router.post('/upload', upload.array('files'), uploadFile);
router.get('/download', downloadFile);
router.delete('/:id', deleteFile);
router.post('/folder', createFolder);

module.exports = router;

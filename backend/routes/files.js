const express = require('express');
const router = express.Router();

const { getFolderFiles, getFolderSizeRoute, getTotalUserUploadSize, previewFile, generateVideoThumbnail, generateImageThumbnail, deleteFileOrFolder, handleChunkUpload } = require('../controllers/fileController');
const { verifyToken } = require('../middleware/auth');

router.get('/', getFolderFiles);
router.get('/folder-size', verifyToken, getFolderSizeRoute);
router.get('/total-size', verifyToken, getTotalUserUploadSize);
router.get('/thumbs/:filename', verifyToken, generateVideoThumbnail);
router.get('/img-thumbs/:filename', verifyToken, generateImageThumbnail);
router.get('/preview/:filename', verifyToken, previewFile);
router.delete('/delete/:filename', verifyToken, deleteFileOrFolder);


const multer = require('multer');
const upload = multer({ dest: '../uploads' }); // Passe den Zielordner an!
router.post('/upload-chunk', verifyToken, upload.single('file'), handleChunkUpload);

module.exports = router;

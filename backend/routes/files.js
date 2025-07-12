const express = require('express');
const multer = require('multer');
const router = express.Router();
const upload = multer({ dest: '../uploads' });

const { getFolderFiles, getFolderSizeRoute, getTotalUserUploadSize, previewFile, generateImageThumbnail, deleteFileOrFolder, handleChunkUpload } = require('../controllers/fileController');
const { verifyToken } = require('../middleware/auth');

router.get('/', getFolderFiles);

router.get('/folder-size', verifyToken, getFolderSizeRoute);
router.get('/total-size', verifyToken, getTotalUserUploadSize);

router.get('/img-thumbs/:filename', verifyToken, generateImageThumbnail);
router.get('/preview/:filename', verifyToken, previewFile);

router.delete('/delete/:filename', verifyToken, deleteFileOrFolder);
router.post('/upload-chunk', verifyToken, upload.single('file'), handleChunkUpload);

module.exports = router;

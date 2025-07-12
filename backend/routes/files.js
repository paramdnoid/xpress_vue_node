const express = require('express');
const router = express.Router();

const { getFolderFiles, getFolderSizeRoute, getTotalUserUploadSize, previewFile, generateVideoThumbnail, generateImageThumbnail, deleteFileOrFolder, handleUpload } = require('../controllers/fileController');
const { verifyToken } = require('../middleware/auth');

router.get('/', getFolderFiles);
router.get('/folder-size', verifyToken, getFolderSizeRoute);
router.get('/total-size', verifyToken, getTotalUserUploadSize);
router.get('/thumbs/:filename', verifyToken, generateVideoThumbnail);
router.get('/img-thumbs/:filename', verifyToken, generateImageThumbnail);
router.get('/preview/:filename', verifyToken, previewFile);
router.delete('/delete/:filename', verifyToken, deleteFileOrFolder);
router.post('/upload', verifyToken, handleUpload);

module.exports = router;

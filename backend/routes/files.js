const express = require('express');
const multer = require('multer');
const router = express.Router();

const { getFolderFiles, getFolderSizeRoute, getTotalUserUploadSize, previewFile, generateVideoThumbnail, generateImageThumbnail, deleteFileOrFolder, handleUpload } = require('../controllers/fileController');
const { verifyToken } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getFolderFiles);
router.get('/folder-size', verifyToken, getFolderSizeRoute);
router.get('/total-size', verifyToken, getTotalUserUploadSize);
router.get('/thumbs/:filename', verifyToken, generateVideoThumbnail);
router.get('/img-thumbs/:filename', verifyToken, generateImageThumbnail);
router.get('/preview/:filename', verifyToken, previewFile);
router.delete('/delete/:filename', verifyToken, deleteFileOrFolder);
router.post('/upload', verifyToken, upload.any(), handleUpload);

module.exports = router;

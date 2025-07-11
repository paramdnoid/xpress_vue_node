const express = require('express');
const router = express.Router();

const { getFolderFiles, getFolderSizeRoute, getTotalUserUploadSize } = require('../controllers/fileController');
const { verifyToken } = require('../middleware/auth');

router.get('/', getFolderFiles);
router.get('/folder-size', verifyToken, getFolderSizeRoute);
router.get('/total-size', verifyToken, getTotalUserUploadSize);

module.exports = router;

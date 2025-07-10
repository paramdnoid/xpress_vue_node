const express = require('express');
const router = express.Router();

const { getFolderFiles } = require('../controllers/fileController');

router.get('/', getFolderFiles);

module.exports = router;

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/documentController');

const router = express.Router();
const storageDirectory = path.resolve(__dirname, '../../storage');
const defaultMaxFileSize = 50 * 1024 * 1024;
const configuredMaxFileSize = Number(process.env.MAX_FILE_SIZE);
const maxFileSize = Number.isSafeInteger(configuredMaxFileSize) && configuredMaxFileSize > 0
  ? configuredMaxFileSize
  : defaultMaxFileSize;

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => callback(error, storageDirectory));
  },
  filename(req, file, callback) {
    callback(null, crypto.randomUUID());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
});

router.post('/upload', documentController.requireOwner, upload.single('file'), documentController.upload);
router.get('/documents', documentController.requireOwner, documentController.list);
router.get('/documents/:id/download', documentController.requireOwner, documentController.download);
router.use(documentController.handleError);

module.exports = router;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const uploadRoot = process.env.VERCEL
  ? path.join('/tmp', 'nexora-uploads')
  : path.join(__dirname, '..', '..', config.uploadDir);

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadRoot),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
});

module.exports = { upload, uploadRoot };

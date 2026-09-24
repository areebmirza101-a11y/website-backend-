const multer = require('multer');
const path = require('path');
const fs = require('fs');
const createError = require('http-errors');
const os = require('os');

// Use /tmp for serverless environments (like Vercel) which have a read-only filesystem
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION;
const uploadDir = isServerless 
  ? path.join(os.tmpdir(), 'uploads') 
  : path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .slice(0, 40);
    const unique = `${base}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(createError(400, 'Only image files (jpg, png, webp, gif, avif) are allowed'));
  },
});

module.exports = upload;

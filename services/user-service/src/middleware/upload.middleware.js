const path = require('path');
const multer = require('multer');
const { AppError } = require('@rideshare/shared');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname) || '.bin';
    const name = `${req.user.userId}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocs = ['image/jpeg', 'image/png', 'application/pdf'];
  const isAvatar = req.path.includes('avatar');
  const allowed = isAvatar ? allowedImages : allowedDocs;
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type', 400, 'VALIDATION_ERROR'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadAvatar = upload.single('avatar');
const uploadLicense = upload.single('license');

module.exports = { uploadAvatar, uploadLicense, UPLOAD_DIR };

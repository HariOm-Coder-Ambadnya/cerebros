import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB) || 20;

// Ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIMETYPES = new Set(['application/pdf', 'text/plain']);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.txt']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMime = ALLOWED_MIMETYPES.has(file.mimetype);
  const isValidExt = ALLOWED_EXTENSIONS.has(ext);

  if (isValidMime && isValidExt) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only .pdf and .txt files are allowed.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024,
    files: 1,
  },
});

// Multer error handler middleware
export function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `File too large. Maximum size is ${MAX_SIZE_MB}MB.` });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
}

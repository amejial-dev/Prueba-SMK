const path = require('path');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const safeOriginalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueName = `${Date.now()}-${safeOriginalName}`;
    cb(null, uniqueName);
  },
});

const MIMETYPES_PERMITIDOS = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/csv',
  'text/plain',
  'application/octet-stream', // algunos clientes no detectan un mimetype específico para .csv
];

function fileFilter(req, file, cb) {
  const extensionValida = path.extname(file.originalname).toLowerCase() === '.csv';
  const mimetypeValido = MIMETYPES_PERMITIDOS.includes(file.mimetype);

  if (!extensionValida || !mimetypeValido) {
    const err = new Error('Solo se permiten archivos con formato CSV.');
    err.statusCode = 400;
    return cb(err);
  }

  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_CSV_FILE_SIZE_MB || 5) * 1024 * 1024,
  },
});

module.exports = upload;

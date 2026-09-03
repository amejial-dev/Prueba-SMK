const path = require('path');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const nombreUnico = `${Date.now()}-${file.originalname}`;
    cb(null, nombreUnico);
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
});

module.exports = upload;

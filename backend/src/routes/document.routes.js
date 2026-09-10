const { Router } = require('express');
const { param, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const documentController = require('../controllers/document.controller');

const router = Router();

function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const err = new Error('Datos de entrada inválidos.');
    err.statusCode = 400;
    err.details = result.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(err);
  }
  return next();
}

const validateId = [param('id').isInt().withMessage('id debe ser un número entero.'), handleValidation];

router.post('/', authenticate, upload.single('file'), documentController.upload);
router.get('/', authenticate, documentController.list);
router.get('/:id/download', authenticate, validateId, documentController.download);
router.delete('/:id', authenticate, authorize(['admin']), validateId, documentController.remove);

module.exports = router;

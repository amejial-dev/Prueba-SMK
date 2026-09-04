const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { register, login } = require('../controllers/auth.controller');

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

router.post(
  '/register',
  [
    body('nombre').isString().withMessage('nombre debe ser texto.').bail().trim().notEmpty().withMessage('nombre es requerido.'),
    body('contraseña').isString().withMessage('contraseña debe ser texto.').bail().notEmpty().withMessage('contraseña es requerida.'),
    body('confirmarContraseña')
      .isString()
      .withMessage('confirmarContraseña debe ser texto.')
      .bail()
      .notEmpty()
      .withMessage('confirmarContraseña es requerida.'),
  ],
  handleValidation,
  register
);

router.post(
  '/login',
  [
    body('nombre').isString().withMessage('nombre debe ser texto.').bail().trim().notEmpty().withMessage('nombre es requerido.'),
    body('contraseña').isString().withMessage('contraseña debe ser texto.').bail().notEmpty().withMessage('contraseña es requerida.'),
  ],
  handleValidation,
  login
);

module.exports = router;

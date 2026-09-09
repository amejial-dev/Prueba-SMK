/* eslint-disable no-unused-vars */

const multer = require('multer');

function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Errores de multer (tamaño excedido, etc.) al procesar el archivo subido.
  if (err instanceof multer.MulterError) {
    const maxMb = process.env.MAX_CSV_FILE_SIZE_MB || 5;
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `El archivo supera el tamaño máximo permitido (${maxMb} MB).`
        : `Error al procesar el archivo subido: ${err.message}`;
    return res.status(400).json({ error: { message } });
  }

  // Errores de validación de express-validator, lanzados manualmente
  // con { statusCode, message, details }.
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  // Errores de restricciones únicas de Sequelize (ej. nombre duplicado).
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: {
        message: 'El recurso ya existe.',
        details: err.errors ? err.errors.map((e) => ({ field: e.path, message: e.message })) : undefined,
      },
    });
  }

  // Errores de validación de Sequelize (a nivel de modelo).
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: {
        message: 'Datos inválidos.',
        details: err.errors ? err.errors.map((e) => ({ field: e.path, message: e.message })) : undefined,
      },
    });
  }

  console.error(err);

  return res.status(500).json({
    error: { message: 'Error interno del servidor.' },
  });
}

module.exports = errorMiddleware;

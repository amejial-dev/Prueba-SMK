const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { message: 'No se proporcionó un token de autenticación.' },
    });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({
      error: { message: 'Token inválido o expirado.' },
    });
  }
}

function authorize(rolesPermitidos) {
  return function (req, res, next) {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        error: { message: 'No tiene permisos para acceder a este recurso.' },
      });
    }
    return next();
  };
}

module.exports = { authenticate, authorize };

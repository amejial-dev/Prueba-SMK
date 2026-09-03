const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const SALT_ROUNDS = 10;

async function register(req, res, next) {
  try {
    const { nombre, contraseña, confirmarContraseña, rol } = req.body;

    if (contraseña !== confirmarContraseña) {
      const err = new Error('Las contraseñas no coinciden.');
      err.statusCode = 400;
      err.details = [{ field: 'confirmarContraseña', message: 'Debe coincidir con contraseña.' }];
      return next(err);
    }

    const existente = await User.findOne({ where: { nombre } });
    if (existente) {
      const err = new Error('El nombre de usuario ya está registrado.');
      err.statusCode = 409;
      err.details = [{ field: 'nombre', message: 'Ya existe un usuario con ese nombre.' }];
      return next(err);
    }

    const passwordHash = await bcrypt.hash(contraseña, SALT_ROUNDS);

    const user = await User.create({ nombre, passwordHash, rol });

    return res.status(201).json({
      id: user.id,
      nombre: user.nombre,
      rol: user.rol,
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { nombre, contraseña } = req.body;

    const user = await User.findOne({ where: { nombre } });
    if (!user) {
      const err = new Error('Credenciales inválidas.');
      err.statusCode = 401;
      return next(err);
    }

    const passwordValida = await bcrypt.compare(contraseña, user.passwordHash);
    if (!passwordValida) {
      const err = new Error('Credenciales inválidas.');
      err.statusCode = 401;
      return next(err);
    }

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login };

const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('../models/user.model');

const SALT_ROUNDS = 10;

async function run() {
  const nombre = process.env.ADMIN_SEED_NOMBRE;
  const contraseña = process.env.ADMIN_SEED_PASSWORD;

  if (!nombre || !contraseña) {
    console.error(
      'Faltan variables de entorno requeridas.\n' +
        'Uso:\n' +
        '  ADMIN_SEED_NOMBRE=admin ADMIN_SEED_PASSWORD=algo-seguro npm run seed:admin'
    );
    process.exit(1);
    return;
  }

  try {
    await sequelize.authenticate();

    const existente = await User.findOne({ where: { nombre } });

    if (existente) {
      existente.rol = 'admin';
      await existente.save();
      console.log(`Usuario "${nombre}" actualizado: ahora tiene rol "admin".`);
    } else {
      const passwordHash = await bcrypt.hash(contraseña, SALT_ROUNDS);
      await User.create({ nombre, passwordHash, rol: 'admin' });
      console.log(`Usuario "${nombre}" creado con rol "admin".`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error al crear/promover el usuario admin:', error.message);
    process.exit(1);
  }
}

run();

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/database');
// TODO: importar rutas propias cuando existan, ej:
// const authRoutes = require('./routes/auth.routes');
// const documentRoutes = require('./routes/documents.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// TODO: montar rutas propias, ej:
// app.use('/api/auth', authRoutes);
// app.use('/api/documents', documentRoutes);

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida.');

    // TODO: una vez definidos los modelos en src/models, sincronizarlos:
    // await sequelize.sync();

    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
    process.exit(1);
  }
}

start();

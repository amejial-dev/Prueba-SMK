const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Document extends Model {}

Document.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombreOriginal: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nombreArchivo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rutaArchivo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    numeroRegistros: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Document',
    tableName: 'documents',
    timestamps: true,
  }
);

module.exports = Document;

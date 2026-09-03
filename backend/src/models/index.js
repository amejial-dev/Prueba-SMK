const sequelize = require('../config/database');
const User = require('./user.model');
const Document = require('./document.model');
const DocumentRow = require('./documentRow.model');

User.hasMany(Document, { foreignKey: 'usuarioId' });
Document.belongsTo(User, { foreignKey: 'usuarioId' });

Document.hasMany(DocumentRow, { foreignKey: 'documentId', onDelete: 'CASCADE' });
DocumentRow.belongsTo(Document, { foreignKey: 'documentId' });

module.exports = {
  sequelize,
  User,
  Document,
  DocumentRow,
};

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { sequelize, Document, DocumentRow, User } = require('../models');
const { validateRows } = require('../utils/csvValidator');

function deleteFileIfExists(filePath) {
  fs.unlink(filePath, (unlinkErr) => {
    if (unlinkErr) {
      console.error('No se pudo borrar el archivo temporal:', unlinkErr);
    }
  });
}

async function upload(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error('No se recibió ningún archivo CSV.');
      err.statusCode = 400;
      return next(err);
    }

    const filePath = req.file.path;
    let records;

    try {
      const fileContent = fs.readFileSync(filePath);
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseError) {
      deleteFileIfExists(filePath);
      const err = new Error('No se pudo parsear el archivo CSV. Verifique el formato.');
      err.statusCode = 400;
      return next(err);
    }

    const { validRows, errors } = validateRows(records);

    if (errors.length > 0) {
      deleteFileIfExists(filePath);
      const err = new Error('El archivo CSV contiene filas inválidas.');
      err.statusCode = 400;
      err.details = errors;
      return next(err);
    }

    const document = await sequelize.transaction(async (t) => {
      const newDocument = await Document.create(
        {
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: filePath,
          recordCount: validRows.length,
          userId: req.user.id,
        },
        { transaction: t }
      );

      const rowsToCreate = validRows.map((row) => ({
        ...row,
        documentId: newDocument.id,
      }));

      await DocumentRow.bulkCreate(rowsToCreate, { transaction: t });

      return newDocument;
    });

    return res.status(201).json({
      id: document.id,
      originalName: document.originalName,
      recordCount: document.recordCount,
      userId: document.userId,
      createdAt: document.createdAt,
    });
  } catch (error) {
    if (req.file && req.file.path) {
      deleteFileIfExists(req.file.path);
    }
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const documents = await Document.findAll({
      include: [{ model: User, attributes: ['id', 'nombre'] }],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json(
      documents.map((doc) => ({
        id: doc.id,
        originalName: doc.originalName,
        user: doc.User ? { id: doc.User.id, nombre: doc.User.nombre } : null,
        uploadedAt: doc.createdAt,
        recordCount: doc.recordCount,
      }))
    );
  } catch (error) {
    return next(error);
  }
}

async function download(req, res, next) {
  try {
    const { id } = req.params;
    const document = await Document.findByPk(id);

    if (!document) {
      const err = new Error('El documento solicitado no existe.');
      err.statusCode = 404;
      return next(err);
    }

    return res.download(document.filePath, document.originalName, (downloadErr) => {
      if (downloadErr && !res.headersSent) {
        return next(downloadErr);
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const document = await Document.findByPk(id);

    if (!document) {
      const err = new Error('El documento solicitado no existe.');
      err.statusCode = 404;
      return next(err);
    }

    await document.destroy();

    return res.status(200).json({ message: 'Documento eliminado correctamente.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { upload, list, download, remove };

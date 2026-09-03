const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { sequelize, Document, DocumentRow, User } = require('../models');
const { validarFilas } = require('../utils/csvValidator');

function eliminarArchivoSiExiste(rutaArchivo) {
  fs.unlink(rutaArchivo, (unlinkErr) => {
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

    const rutaArchivo = req.file.path;
    let registros;

    try {
      const contenido = fs.readFileSync(rutaArchivo);
      registros = parse(contenido, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseError) {
      eliminarArchivoSiExiste(rutaArchivo);
      const err = new Error('No se pudo parsear el archivo CSV. Verifique el formato.');
      err.statusCode = 400;
      return next(err);
    }

    const { validas, errores } = validarFilas(registros);

    if (errores.length > 0) {
      eliminarArchivoSiExiste(rutaArchivo);
      const err = new Error('El archivo CSV contiene filas inválidas.');
      err.statusCode = 400;
      err.details = errores;
      return next(err);
    }

    const documento = await sequelize.transaction(async (t) => {
      const nuevoDocumento = await Document.create(
        {
          nombreOriginal: req.file.originalname,
          nombreArchivo: req.file.filename,
          rutaArchivo: rutaArchivo,
          numeroRegistros: validas.length,
          usuarioId: req.user.id,
        },
        { transaction: t }
      );

      const filasParaCrear = validas.map((fila) => ({
        ...fila,
        documentId: nuevoDocumento.id,
      }));

      await DocumentRow.bulkCreate(filasParaCrear, { transaction: t });

      return nuevoDocumento;
    });

    return res.status(201).json({
      id: documento.id,
      nombreOriginal: documento.nombreOriginal,
      numeroRegistros: documento.numeroRegistros,
      usuarioId: documento.usuarioId,
      createdAt: documento.createdAt,
    });
  } catch (error) {
    if (req.file && req.file.path) {
      eliminarArchivoSiExiste(req.file.path);
    }
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const documentos = await Document.findAll({
      include: [{ model: User, attributes: ['id', 'nombre'] }],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json(
      documentos.map((doc) => ({
        id: doc.id,
        nombreOriginal: doc.nombreOriginal,
        usuario: doc.User ? { id: doc.User.id, nombre: doc.User.nombre } : null,
        fechaCarga: doc.createdAt,
        numeroRegistros: doc.numeroRegistros,
      }))
    );
  } catch (error) {
    return next(error);
  }
}

async function download(req, res, next) {
  try {
    const { id } = req.params;
    const documento = await Document.findByPk(id);

    if (!documento) {
      const err = new Error('El documento solicitado no existe.');
      err.statusCode = 404;
      return next(err);
    }

    return res.download(documento.rutaArchivo, documento.nombreOriginal, (downloadErr) => {
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
    const documento = await Document.findByPk(id);

    if (!documento) {
      const err = new Error('El documento solicitado no existe.');
      err.statusCode = 404;
      return next(err);
    }

    const rutaArchivo = documento.rutaArchivo;

    await documento.destroy();

    eliminarArchivoSiExiste(rutaArchivo);

    return res.status(200).json({ message: 'Documento eliminado correctamente.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { upload, list, download, remove };

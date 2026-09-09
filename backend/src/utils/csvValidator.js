const validator = require('validator');

// Debe coincidir con el límite VARCHAR(255) de las columnas en document_rows.
const LONGITUD_MAXIMA = 255;

/**
 * Valida un array de filas parseadas de un CSV de contactos.
 *
 * Reglas (ver design.md):
 * - correo: formato de email válido, máximo 255 caracteres.
 * - nombre: string no vacío tras trim(), máximo 255 caracteres.
 * - telefono: convertible a número (solo dígitos tras trim()), máximo 255 caracteres, se conserva como string.
 * - ciudad: string no vacío tras trim(), máximo 255 caracteres.
 * - notas: opcional, máximo 255 caracteres, se persiste tal cual o null si viene vacío.
 *
 * @param {Array<{correo?: string, nombre?: string, telefono?: string, ciudad?: string, notas?: string}>} rows
 * @returns {{ validRows: Array<object>, errors: Array<{fila: number, campo: string, mensaje: string}> }}
 */
function validateRows(rows) {
  const validRows = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 1; // 1-based, referida a la primera fila de datos del CSV.
    const rowErrors = [];

    const correo = typeof row.correo === 'string' ? row.correo.trim() : '';
    const nombre = typeof row.nombre === 'string' ? row.nombre.trim() : '';
    const telefono = typeof row.telefono === 'string' ? row.telefono.trim() : '';
    const ciudad = typeof row.ciudad === 'string' ? row.ciudad.trim() : '';
    const notasRaw = typeof row.notas === 'string' ? row.notas.trim() : '';

    if (!correo || !validator.isEmail(correo)) {
      rowErrors.push({ fila: rowNumber, campo: 'correo', mensaje: 'El correo no tiene un formato de email válido.' });
    } else if (correo.length > LONGITUD_MAXIMA) {
      rowErrors.push({ fila: rowNumber, campo: 'correo', mensaje: `El correo no puede superar los ${LONGITUD_MAXIMA} caracteres.` });
    }

    if (!nombre) {
      rowErrors.push({ fila: rowNumber, campo: 'nombre', mensaje: 'El nombre es requerido.' });
    } else if (nombre.length > LONGITUD_MAXIMA) {
      rowErrors.push({ fila: rowNumber, campo: 'nombre', mensaje: `El nombre no puede superar los ${LONGITUD_MAXIMA} caracteres.` });
    }

    if (!telefono || !/^\d+$/.test(telefono)) {
      rowErrors.push({ fila: rowNumber, campo: 'telefono', mensaje: 'El teléfono debe ser numérico.' });
    } else if (telefono.length > LONGITUD_MAXIMA) {
      rowErrors.push({ fila: rowNumber, campo: 'telefono', mensaje: `El teléfono no puede superar los ${LONGITUD_MAXIMA} caracteres.` });
    }

    if (!ciudad) {
      rowErrors.push({ fila: rowNumber, campo: 'ciudad', mensaje: 'La ciudad es requerida.' });
    } else if (ciudad.length > LONGITUD_MAXIMA) {
      rowErrors.push({ fila: rowNumber, campo: 'ciudad', mensaje: `La ciudad no puede superar los ${LONGITUD_MAXIMA} caracteres.` });
    }

    if (notasRaw.length > LONGITUD_MAXIMA) {
      rowErrors.push({ fila: rowNumber, campo: 'notas', mensaje: `Las notas no pueden superar los ${LONGITUD_MAXIMA} caracteres.` });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      validRows.push({
        correo,
        nombre,
        telefono,
        ciudad,
        notas: notasRaw || null,
      });
    }
  });

  return { validRows, errors };
}

module.exports = { validateRows };

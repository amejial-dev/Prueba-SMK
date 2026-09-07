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
 * @param {Array<{correo?: string, nombre?: string, telefono?: string, ciudad?: string, notas?: string}>} filas
 * @returns {{ validas: Array<object>, errores: Array<{fila: number, campo: string, mensaje: string}> }}
 */
function validarFilas(filas) {
  const validas = [];
  const errores = [];

  filas.forEach((fila, index) => {
    const numeroFila = index + 1; // 1-based, referida a la primera fila de datos del CSV.
    const filaErrores = [];

    const correo = typeof fila.correo === 'string' ? fila.correo.trim() : '';
    const nombre = typeof fila.nombre === 'string' ? fila.nombre.trim() : '';
    const telefono = typeof fila.telefono === 'string' ? fila.telefono.trim() : '';
    const ciudad = typeof fila.ciudad === 'string' ? fila.ciudad.trim() : '';
    const notasRaw = typeof fila.notas === 'string' ? fila.notas.trim() : '';

    if (!correo || !validator.isEmail(correo)) {
      filaErrores.push({ fila: numeroFila, campo: 'correo', mensaje: 'El correo no tiene un formato de email válido.' });
    } else if (correo.length > LONGITUD_MAXIMA) {
      filaErrores.push({ fila: numeroFila, campo: 'correo', mensaje: `El correo no puede superar los ${LONGITUD_MAXIMA} caracteres.` });
    }

    if (!nombre) {
      filaErrores.push({ fila: numeroFila, campo: 'nombre', mensaje: 'El nombre es requerido.' });
    } else if (nombre.length > LONGITUD_MAXIMA) {
      filaErrores.push({ fila: numeroFila, campo: 'nombre', mensaje: `El nombre no puede superar los ${LONGITUD_MAXIMA} caracteres.` });
    }

    if (!telefono || !/^\d+$/.test(telefono)) {
      filaErrores.push({ fila: numeroFila, campo: 'telefono', mensaje: 'El teléfono debe ser numérico.' });
    } else if (telefono.length > LONGITUD_MAXIMA) {
      filaErrores.push({ fila: numeroFila, campo: 'telefono', mensaje: `El teléfono no puede superar los ${LONGITUD_MAXIMA} caracteres.` });
    }

    if (!ciudad) {
      filaErrores.push({ fila: numeroFila, campo: 'ciudad', mensaje: 'La ciudad es requerida.' });
    } else if (ciudad.length > LONGITUD_MAXIMA) {
      filaErrores.push({ fila: numeroFila, campo: 'ciudad', mensaje: `La ciudad no puede superar los ${LONGITUD_MAXIMA} caracteres.` });
    }

    if (notasRaw.length > LONGITUD_MAXIMA) {
      filaErrores.push({ fila: numeroFila, campo: 'notas', mensaje: `Las notas no pueden superar los ${LONGITUD_MAXIMA} caracteres.` });
    }

    if (filaErrores.length > 0) {
      errores.push(...filaErrores);
    } else {
      validas.push({
        correo,
        nombre,
        telefono,
        ciudad,
        notas: notasRaw || null,
      });
    }
  });

  return { validas, errores };
}

module.exports = { validarFilas };

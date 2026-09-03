const validator = require('validator');

/**
 * Valida un array de filas parseadas de un CSV de contactos.
 *
 * Reglas (ver design.md):
 * - correo: formato de email válido.
 * - nombre: string no vacío tras trim().
 * - telefono: convertible a número (solo dígitos tras trim()), se conserva como string.
 * - ciudad: string no vacío tras trim().
 * - notas: opcional, se persiste tal cual o null si viene vacío.
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
    }

    if (!nombre) {
      filaErrores.push({ fila: numeroFila, campo: 'nombre', mensaje: 'El nombre es requerido.' });
    }

    if (!telefono || !/^\d+$/.test(telefono)) {
      filaErrores.push({ fila: numeroFila, campo: 'telefono', mensaje: 'El teléfono debe ser numérico.' });
    }

    if (!ciudad) {
      filaErrores.push({ fila: numeroFila, campo: 'ciudad', mensaje: 'La ciudad es requerida.' });
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

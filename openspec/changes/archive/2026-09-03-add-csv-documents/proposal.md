## Why

El auth ya existe (`add-user-auth`), pero el propósito real de la herramienta —gestionar documentos CSV— todavía no tiene backend. Sin un modelo de documentos ni un endpoint de carga/validación, el frontend no tiene nada real que mostrar en el dashboard.

## What Changes

- Modelo `Document` en Sequelize: nombre del archivo original, usuario que lo cargó (FK a `User`), fecha de carga, número de registros procesados, ruta de almacenamiento en disco.
- Modelo `DocumentRow` (o tabla equivalente) para persistir cada fila válida del CSV: `correo`, `nombre`, `telefono`, `ciudad`, `notas`, con FK al `Document` que la originó.
- Endpoint `POST /api/documents` (protegido con `authenticate`): recibe un CSV vía `multer`, lo parsea con `csv-parse`, valida cada fila (`correo` formato email, `nombre` string no vacío, `telefono` numérico, `ciudad` no vacío, `notas` opcional). Si hay filas inválidas, responde 400 con el detalle de cada error (fila + campo + motivo) y no persiste nada. Si todo es válido, guarda el archivo original, crea el `Document` y sus `DocumentRow`, y responde 201.
- Endpoint `GET /api/documents` (protegido con `authenticate`): lista los documentos cargados con nombre, usuario que lo cargó, fecha de carga y número de registros.
- Endpoint `GET /api/documents/:id/download` (protegido con `authenticate`): descarga el archivo CSV original.
- Endpoint `DELETE /api/documents/:id` (protegido con `authenticate` + `authorize(['admin'])`): elimina el registro del documento y sus filas asociadas.

## Capabilities

### New Capabilities
- `csv-documents`: carga, validación, listado, descarga y eliminación de documentos CSV, con RBAC (eliminar solo `admin`).

### Modified Capabilities
(ninguna — `user-auth` se reutiliza tal cual vía sus middlewares, sin cambiar su contrato)

## Impact

- Archivos nuevos: `backend/src/models/document.model.js`, `backend/src/models/documentRow.model.js`, `backend/src/controllers/document.controller.js`, `backend/src/routes/document.routes.js`, `backend/src/middlewares/upload.middleware.js` (config de multer), `backend/src/utils/csvValidator.js`.
- Archivos modificados: `backend/src/models/index.js` (registrar los nuevos modelos y sus asociaciones con `User`), `backend/src/index.js` (montar `/api/documents`).
- Usa `backend/uploads/` (ya existe con `.gitkeep`) como almacenamiento de los CSV originales.
- Reutiliza `authenticate`/`authorize` de `add-user-auth` sin modificarlos.

## 1. Modelos de datos

- [x] 1.1 Crear `backend/src/models/document.model.js` (Sequelize) con `nombreOriginal` (string, not null), `nombreArchivo` (string, not null, nombre en disco), `rutaArchivo` (string, not null), `numeroRegistros` (integer, not null), `usuarioId` (FK a `User`, not null) y verificar que exporta el modelo correctamente.
- [x] 1.2 Crear `backend/src/models/documentRow.model.js` con `correo`, `nombre`, `telefono`, `ciudad` (string, not null) y `notas` (string, nullable), más `documentId` (FK a `Document`, not null) y verificar que exporta el modelo correctamente.
- [x] 1.3 Actualizar `backend/src/models/index.js` para registrar `Document` y `DocumentRow`, definir las asociaciones (`User.hasMany(Document)`, `Document.belongsTo(User)`, `Document.hasMany(DocumentRow, { onDelete: 'CASCADE' })`, `DocumentRow.belongsTo(Document)`) y exportarlos junto a `User`/`sequelize`. Verificar con `require('./models')` que no lanza errores y expone los 3 modelos.

## 2. Validación de CSV

- [x] 2.1 Crear `backend/src/utils/csvValidator.js` con una función que reciba un array de filas parseadas (objetos `{correo, nombre, telefono, ciudad, notas}`) y devuelva `{ validas: [...], errores: [{fila, campo, mensaje}] }` aplicando las reglas de `design.md` (correo formato email, nombre no vacío, telefono numérico, ciudad no vacío, notas opcional). Verificar con casos manuales (un array con una fila válida y otra con teléfono no numérico) que separa correctamente válidas de errores.

## 3. Carga de archivos

- [x] 3.1 Crear `backend/src/middlewares/upload.middleware.js` configurando `multer` con `diskStorage` hacia `backend/uploads/`, aceptando solo archivos `.csv` (rechazar otras extensiones/mimetypes con error controlado), y exportar el middleware listo para usar en la ruta de carga. Verificar que el archivo carga sin errores de sintaxis y que la configuración de `destination`/`filename` apunta a la carpeta correcta.
- [x] 3.2 Crear `backend/src/controllers/document.controller.js` con `upload`: lee el archivo recibido por multer, lo parsea con `csv-parse` (con headers), lo valida con `csvValidator`, y si hay errores responde 400 con la lista detallada (y borra el archivo temporal subido); si es válido, crea `Document` + sus `DocumentRow` dentro de una transacción de Sequelize y responde 201 con los datos del documento creado (incluyendo `numeroRegistros`). Verificar manualmente con un CSV de prueba válido y otro con una fila inválida (sin necesitar BD real, mockeando o aislando la función de validación si Postgres no está disponible).

## 4. Listado, descarga y eliminación

- [x] 4.1 Añadir `list` al controller: `GET` que retorna todos los `Document` con `nombreOriginal`, usuario (nombre), fecha de creación y `numeroRegistros`, ordenados por fecha descendente.
- [x] 4.2 Añadir `download` al controller: `GET /:id/download` que busca el `Document` por id, responde 404 si no existe, y si existe transmite el archivo en `rutaArchivo` como descarga (`res.download` o equivalente) usando `nombreOriginal` como nombre de descarga.
- [x] 4.3 Añadir `remove` al controller: `DELETE /:id` que elimina el `Document` (las `DocumentRow` se eliminan en cascada) y borra el archivo físico de `backend/uploads/`; responde 404 si el documento no existe.
- [x] 4.4 Crear `backend/src/routes/document.routes.js`: `POST /` (`authenticate`, `upload.middleware`, `controller.upload`), `GET /` (`authenticate`, `controller.list`), `GET /:id/download` (`authenticate`, `controller.download`), `DELETE /:id` (`authenticate`, `authorize(['admin'])`, `controller.remove`).

## 5. Integración

- [x] 5.1 Modificar `backend/src/index.js` para montar `app.use('/api/documents', documentRoutes)`. Verificar que `node --check` pasa y que el servidor sigue arrancando sin errores de sintaxis/require (con o sin Postgres accesible).
- [ ] 5.2 Verificación end-to-end (requiere Postgres accesible, ej. `docker compose up db`): probar manualmente carga válida (201 + numeroRegistros correcto), carga con fila inválida (400 + detalle, nada persistido), listado (`GET /api/documents` refleja lo cargado), descarga (devuelve el CSV original), eliminación con `user` (403) y con `admin` (200, y el documento desaparece del listado). Si no hay Postgres disponible en este entorno, dejar esta tarea sin marcar y anotarlo explícitamente.

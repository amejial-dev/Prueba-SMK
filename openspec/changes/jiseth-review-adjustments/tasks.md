## 1. Soft delete de documentos

- [x] 1.1 En `backend/src/models/document.model.js`: agregar `paranoid: true` al objeto de opciones de `Document.init(...)` (el segundo argumento, junto a `sequelize`, `modelName`, `tableName`, `timestamps: true`). No agregar ninguna columna manual (`deletedAt` la gestiona Sequelize automáticamente). Verificar levantando `docker compose up --build` y confirmando en los logs de `backend` que `sequelize.sync()` no falla; luego inspeccionar la tabla `documents` (`docker compose exec db psql -U postgres -d prueba_smk -c "\d documents"`, o los valores de `DB_USER`/`DB_NAME` vigentes) y confirmar que existe la columna `deletedAt`.
- [x] 1.2 En `backend/src/controllers/document.controller.js`, función `remove`: eliminar la llamada `eliminarArchivoSiExiste(rutaArchivo)` (o su nombre renombrado tras la tarea 3.x) que hoy se ejecuta después de `documento.destroy()`. El archivo físico debe quedar intacto en `backend/uploads/` tras eliminar. Dejar el resto de la función (`findByPk`, `destroy()`, respuesta 200) sin cambios de lógica.
- [x] 1.3 Verificar manualmente con la stack levantada (`docker compose up`): subir un CSV válido, anotar su `id` y el nombre del archivo en `backend/uploads/`; eliminarlo como admin (`DELETE /api/documents/:id` con JWT de un usuario `admin`); confirmar que (a) la respuesta es 200, (b) `GET /api/documents` ya no incluye ese documento, (c) el archivo sigue presente en `backend/uploads/` dentro del contenedor (`docker compose exec backend ls uploads`), y (d) la fila sigue existiendo en la tabla `documents` con `deletedAt` no nulo (vía `psql`) y sus filas en `document_rows` siguen existiendo (`docker compose exec db psql -U postgres -d prueba_smk -c "SELECT COUNT(*) FROM document_rows WHERE \"documentId\" = <id>;"`).
- [x] 1.4 Confirmar que descargar (`GET /api/documents/:id/download`) o volver a eliminar (`DELETE /api/documents/:id`) el mismo documento ya eliminado responde 404 (comportamiento automático de `paranoid`, sin cambios de código adicionales).

## 2. Selector de rol en registro sin autoasignación de admin

- [x] 2.1 En `frontend/src/views/RegisterView.vue`: agregar en `data()` la propiedad `role: 'user'`. Agregar en el template, dentro del `<form>` y antes del campo de contraseña (o donde tenga sentido visualmente), un bloque `<div class="field">` con `<label for="role">Rol</label>` y:
  ```html
  <select id="role" v-model="role" class="input-glass">
    <option value="user">Usuario</option>
    <option value="admin" disabled>Administrador</option>
  </select>
  <p class="role-hint">El rol de administrador se asigna únicamente por el equipo del sistema.</p>
  ```
  Agregar una regla `.role-hint { font-size: 0.8rem; color: var(--text-color-muted); margin: 0.25rem 0 0; }` en el `<style scoped>` del componente. Incluir `rol: this.role` en el payload de `api.post('/auth/register', { ... })`. Resetear `this.role = 'user'` junto con los demás campos tras un registro exitoso.
- [x] 2.2 En `backend/src/routes/auth.routes.js`, dentro del array de validaciones de `POST /register`, agregar: `body('rol').optional().isIn(['user']).withMessage('rol solo puede ser "user" en el registro público.')`.
- [x] 2.3 En `backend/src/controllers/auth.controller.js`, función `register`: no leer `req.body.rol` para construir el usuario — mantener `User.create({ nombre, passwordHash, rol: 'user' })` (o el equivalente tras la tarea 3.1) con el literal `'user'` fijo, de modo que la validación de la tarea 2.2 sea la única puerta y el valor efectivo nunca dependa del input.
- [x] 2.4 Verificar en el navegador (`docker compose up`, `http://localhost:5173/register`): el selector de rol muestra "Usuario" seleccionado por defecto y "Administrador" deshabilitado (no clickeable); un registro normal sigue funcionando.
- [x] 2.5 Verificar con `curl` (o Postman) contra el backend real que un `POST /api/auth/register` con body `{"nombre":"nuevoadmin","contraseña":"...","confirmarContraseña":"...","rol":"admin"}` responde **400** (no 201) y no crea el usuario (confirmar con un intento de login posterior que falla con 401, o consultando la tabla `users`).

## 3. Nomenclatura en inglés — backend

- [x] 3.1 En `backend/src/models/document.model.js`: renombrar los atributos del modelo `nombreOriginal`→`originalName`, `nombreArchivo`→`fileName`, `rutaArchivo`→`filePath`, `numeroRegistros`→`recordCount`, `usuarioId`→`userId`. No tocar `id`, `timestamps`, `paranoid` (tarea 1.1), `tableName: 'documents'`, `modelName: 'Document'`.
- [x] 3.2 En `backend/src/models/index.js`: actualizar `foreignKey: 'usuarioId'` a `foreignKey: 'userId'` en `User.hasMany(Document, ...)` y `Document.belongsTo(User, ...)`.
- [x] 3.3 En `backend/src/controllers/document.controller.js`, aplicar estos renombres de identificadores internos y de propiedades del modelo (búsqueda y reemplazo consciente del contexto, no automático ciego):
  - Función `eliminarArchivoSiExiste` → `deleteFileIfExists`, parámetro `rutaArchivo` → `filePath`.
  - En `upload`: variable `rutaArchivo` → `filePath`, `registros` → `records`, `contenido` → `fileContent`, `nuevoDocumento` → `newDocument`, `filasParaCrear` → `rowsToCreate`, `documento` → `document` (en el `return` de la transacción y en el bloque de respuesta). Propiedades al crear el `Document`: `nombreOriginal: req.file.originalname` → `originalName: req.file.originalname`, `nombreArchivo: req.file.filename` → `fileName: req.file.filename`, `rutaArchivo: rutaArchivo` → `filePath`, `numeroRegistros: validas.length` → `recordCount` (ajustar también el nombre `validas` si ya se tradujo en la tarea 3.5, o dejar el valor calculado según corresponda), `usuarioId: req.user.id` → `userId: req.user.id`. Respuesta JSON de `upload`: claves `nombreOriginal`, `numeroRegistros`, `usuarioId` → `originalName`, `recordCount`, `userId`.
  - En `list`: variable `documentos` → `documents`, `doc` sin cambio, callback de `.map` con parámetro `doc`. Respuesta JSON por documento: `nombreOriginal` → `originalName`, `usuario: doc.User ? { id: doc.User.id, nombre: doc.User.nombre } : null` → `user: doc.User ? { id: doc.User.id, nombre: doc.User.nombre } : null` (mantener `nombre` interno del objeto `User`, ver tarea 3 nota de diseño: es el campo de wire de auth), `fechaCarga: doc.createdAt` → `uploadedAt: doc.createdAt`, `numeroRegistros` → `recordCount`.
  - En `download` y `remove`: variable `documento` → `document`.
  - Verificar que `Document.findByPk`, `Document.findAll` referencian los nuevos nombres de columna (`filePath`, `originalName`, etc.) en vez de los viejos en TODO el archivo.
- [x] 3.4 En `backend/src/controllers/auth.controller.js`: al inicio de `register`, desestructurar `const { nombre, contraseña, confirmarContraseña } = req.body;` sin cambiar las claves de wire, pero renombrar las variables internas usadas después: `existente` → `existingUser`. En `login`: renombrar `passwordValida` → `isPasswordValid`. No cambiar las claves `nombre`/`contraseña`/`confirmarContraseña`/`rol` en los objetos de respuesta JSON (`res.status(201).json({ id: user.id, nombre: user.nombre, rol: user.rol })`, el payload del JWT, ni la respuesta de `login`).
- [x] 3.5 En `backend/src/utils/csvValidator.js`: renombrar `validarFilas` → `validateRows` (y su export en `module.exports`), parámetro `filas` → `rows`, variables `validas` → `validRows`, `errores` → `errors`, `fila` (parámetro del `.forEach`) → `row`, `numeroFila` → `rowNumber`, `filaErrores` → `rowErrors`, `notasRaw` → `notesRaw`. NO renombrar las claves leídas de cada fila del CSV (`correo`, `nombre`, `telefono`, `ciudad`, `notas`) ni las claves `fila`/`campo`/`mensaje` de cada objeto de error emitido (son parte de la respuesta ya consumida por `DashboardView.vue`/`errorCarga.details`, y no fueron señaladas para traducción). Actualizar el import en `backend/src/controllers/document.controller.js` de `const { validarFilas } = require('../utils/csvValidator');` a `const { validateRows } = require('../utils/csvValidator');` y su uso `validarFilas(registros)` → `validateRows(records)`.
- [x] 3.6 En `backend/src/middlewares/auth.middleware.js`: renombrar el parámetro `rolesPermitidos` de la función `authorize` a `allowedRoles`, y su uso interno (`rolesPermitidos.includes(...)` → `allowedRoles.includes(...)`).
- [x] 3.7 Ejecutar `docker compose exec backend node -e "require('./src/models')"` (o reiniciar el servicio `backend`) y confirmar en los logs que no hay errores de referencia a columnas/propiedades inexistentes tras los renombres.

## 4. Nomenclatura en inglés — frontend (coherente con el nuevo contrato de la API)

- [x] 4.1 En `frontend/src/views/DashboardView.vue`: renombrar en `data()` `documentos` → `documents`, `errorCarga` → `uploadError`. Actualizar el `computed`, `mounted`, y todos los métodos (`fetchDocuments`, `handleUploaded`, `handleUploadError`, `handleDownload`, `handleDelete`) para usar `this.documents`/`this.uploadError`. En `handleDownload`: renombrar `documento` → `document` (cuidado: no colisiona con el `document` global del DOM usado más abajo en la misma función para crear el `<a>` — usar un nombre distinto para la variable local, por ejemplo `targetDocument`, y actualizar sus dos usos: `documento.nombreOriginal` → `targetDocument.originalName`), `nombreDescarga` → `downloadFileName`. Actualizar el template: prop pasada a `<DocumentsTable :documentos="documentos" ...>` → `<DocumentsTable :documents="documents" ...>` (ver tarea 4.2 para el nuevo nombre de prop), y las referencias a `errorCarga` → `uploadError` en el template (incluye `errorCarga.details`/`errorCarga.message`). NO renombrar `session.user.nombre` (es el campo de wire de auth, se mantiene en español).
- [x] 4.2 En `frontend/src/components/DocumentsTable.vue`: renombrar la prop `documentos` → `documents` (en `props` y en el `v-for` del template, iterador `documento` → `document`). Renombrar métodos `formatFecha` → `formatDate`, `nombreUsuario` → `getUserName`. Actualizar referencias a las nuevas claves del backend: `documento.nombreOriginal` → `document.originalName`, `documento.usuario` → `document.user` (y dentro de `getUserName`, `documento.usuario.nombre` → `document.user.nombre`, manteniendo `.nombre` sin traducir), `documento.fechaCarga` → `document.uploadedAt` (pasado a `formatDate`), `documento.numeroRegistros` → `document.recordCount`.
- [x] 4.3 En `frontend/src/components/CsvUploader.vue`: renombrar variable `archivo` → `file` en `handleDrop`, `handleFileChange` y `uploadFile` (parámetro incluido), y `detalle` → `errorDetail` en `uploadFile`.
- [x] 4.4 Verificar en el navegador (`docker compose up`) el flujo completo: login, subir un CSV válido, ver el documento en la tabla con nombre/usuario/fecha/registros correctos, descargarlo, y (como admin) eliminarlo — confirmando que no aparecen errores en la consola del navegador relacionados con propiedades `undefined` (señal de un renombre incompleto entre backend y frontend).

## 5. Estilos de error globales

- [x] 5.1 En `frontend/src/styles/glass.css`: agregar, junto a las demás reglas de utilidad (por ejemplo después de `.input-glass`), la regla:
  ```css
  .error-message {
    color: var(--error-color);
    font-size: 0.9rem;
    margin: 0.5rem 0;
  }
  ```
- [x] 5.2 Eliminar el bloque `.error-message { ... }` del `<style scoped>` de `frontend/src/views/LoginView.vue`, `frontend/src/views/RegisterView.vue` y `frontend/src/views/DashboardView.vue`. No tocar ninguna otra regla de esos bloques (incluida `.error-details`, que se queda donde está).
- [x] 5.3 Confirmar que `frontend/src/main.js` ya importa `./styles/glass.css` (no requiere cambios) y verificar visualmente (`docker compose up`, `http://localhost:5173`) que los mensajes de error de Login (credenciales inválidas), Register (contraseñas no coinciden) y Dashboard (error de carga/descarga/eliminación simulando una falla) se siguen viendo con el color y tamaño esperados.

## 6. Variables de entorno del servicio `db` en docker-compose

- [x] 6.1 En `backend/.env.example`, agregar después de las variables `DB_*` existentes:
  ```
  # Deben coincidir con DB_NAME/DB_USER/DB_PASSWORD: las lee el contenedor
  # de Postgres directamente (imagen oficial), Sequelize sigue usando DB_*.
  POSTGRES_DB=prueba_smk
  POSTGRES_USER=postgres
  POSTGRES_PASSWORD=postgres
  ```
- [x] 6.2 En `docker-compose.yml`, servicio `db`: quitar el bloque `environment:` con `POSTGRES_DB/POSTGRES_USER/POSTGRES_PASSWORD` hardcodeados, y agregar `env_file: - ./backend/.env` (mismo mecanismo que ya usa el servicio `backend`).
- [x] 6.3 Verificar: `docker compose down -v` (para forzar recreación del volumen `db_data` con las nuevas variables) seguido de `docker compose up --build`, confirmando que `db` pasa su healthcheck (`docker compose ps` muestra `db` como healthy) y que `backend` conecta exitosamente (log "Conexión a la base de datos establecida."). Si el usuario no tiene `backend/.env` con las nuevas variables, recordarle copiar de nuevo `cp backend/.env.example backend/.env` o agregarlas manualmente antes de este paso.

## 7. `.env` del frontend en docker-compose

- [x] 7.1 En `docker-compose.yml`, servicio `frontend`: agregar `env_file: - ./frontend/.env`.
- [x] 7.2 En `frontend/.env.example`, agregar un comentario aclarando que esta variable es obligatoria para el flujo con Docker: `# Requerido para que el frontend dockerizado apunte al backend correcto.` sobre la línea `VITE_API_URL=http://localhost:3000/api`.
- [x] 7.3 Confirmar que `frontend/src/services/api.js` no requiere cambio de lógica (el fallback `'http://localhost:3000/api'` se mantiene para `npm run dev` sin Docker); no editar ese archivo salvo para el comentario opcional de la tarea 7.4.
- [x] 7.4 (Opcional, solo comentario) En `frontend/src/services/api.js`, agregar un comentario arriba de la línea `const baseURL = ...` explicando que el fallback es solo para desarrollo local sin Docker y que `docker-compose.yml` debe inyectar `VITE_API_URL` vía `frontend/.env`.
- [x] 7.5 Verificar: `docker compose up --build`, abrir `http://localhost:5173`, y confirmar en las herramientas de red del navegador que las peticiones a `/auth/login` u otras van al valor configurado en `frontend/.env` (por defecto `http://localhost:3000/api`, coherente con el mapeo de puertos de `docker-compose.yml`).

## 8. Límites de tamaño y saneo de nombre en la carga de CSV

- [x] 8.1 En `backend/.env.example`, agregar: `MAX_CSV_FILE_SIZE_MB=5`.
- [x] 8.2 En `backend/src/middlewares/upload.middleware.js`: agregar `require('dotenv').config();` si no está ya cargado en el punto de entrada antes de este módulo (verificar si `backend/src/index.js` ya llama `require('dotenv').config()` antes de requerir las rutas; si es así, no hace falta duplicarlo aquí). Agregar a la configuración de `multer({...})`:
  ```js
  limits: {
    fileSize: Number(process.env.MAX_CSV_FILE_SIZE_MB || 5) * 1024 * 1024,
  },
  ```
- [x] 8.3 En la misma función `filename` del `diskStorage`, sanear el nombre antes de concatenar con el timestamp:
  ```js
  const path = require('path'); // ya está importado arriba del archivo
  // dentro de filename:
  const safeOriginalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const uniqueName = `${Date.now()}-${safeOriginalName}`;
  cb(null, uniqueName);
  ```
  (renombrar la variable existente `nombreUnico` a `uniqueName` de paso, por consistencia con la tarea 3 de nomenclatura).
- [x] 8.4 En `backend/src/middlewares/error.middleware.js`: importar `const multer = require('multer');` al inicio del archivo, y agregar, antes del chequeo de `SequelizeUniqueConstraintError`, un bloque:
  ```js
  if (err instanceof multer.MulterError) {
    const maxMb = process.env.MAX_CSV_FILE_SIZE_MB || 5;
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `El archivo supera el tamaño máximo permitido (${maxMb} MB).`
        : `Error al procesar el archivo subido: ${err.message}`;
    return res.status(400).json({ error: { message } });
  }
  ```
- [x] 8.5 Verificar con `curl` o Postman: subir un archivo CSV mayor al límite configurado (ej. generar uno de >5 MB con datos repetidos) y confirmar respuesta 400 con el mensaje del límite, sin que el archivo quede en `backend/uploads/`. Subir un archivo cuyo nombre original contenga segmentos de ruta (ej. renombrar un CSV local a `..\..\evil.csv` antes de subirlo, o simular con `curl -F "file=@test.csv;filename=../../evil.csv"`) y confirmar que el archivo se guarda dentro de `backend/uploads/` con el nombre saneado (sin haber escapado del directorio) y que la carga se procesa normalmente si el CSV es válido.

## 9. Documentación

- [x] 9.1 En `README.md`, tabla "Variables de entorno (`backend/.env`)": agregar filas para `POSTGRES_DB`/`POSTGRES_USER`/`POSTGRES_PASSWORD` (nota: deben coincidir con `DB_NAME`/`DB_USER`/`DB_PASSWORD`, las usa el contenedor de Postgres) y `MAX_CSV_FILE_SIZE_MB` (límite de tamaño de CSV, default `5`).
- [x] 9.2 En `README.md`, sección "API principal": actualizar la fila de `POST /api/documents` y `GET /api/documents` si mencionan nombres de campo de la respuesta (revisar el texto actual; si no menciona claves JSON explícitas, no hace falta editar esa tabla). Agregar una nota breve en la sección de RBAC o en una nueva línea aclarando que "Eliminar un documento" es un borrado lógico (el archivo original se conserva en el servidor).
- [x] 9.3 Confirmar que `README.md` no contradice el nuevo comportamiento de la tarea 2 (registro): la sección "Cómo levantar el proyecto" ya dice "el registro público solo crea usuarios con `rol: 'user'`"; añadir una frase indicando que el formulario ahora muestra un selector de rol pero solo permite elegir "Usuario" desde la UI.

## 10. Verificación final integrada

- [x] 10.1 Con la stack completa levantada (`docker compose down -v && docker compose up --build`), ejecutar el flujo end-to-end: crear `backend/.env` y `frontend/.env` desde los `.example` actualizados, registrar un usuario normal, promoverlo a admin con `npm run seed:admin`, iniciar sesión como admin, subir un CSV válido, verlo en la tabla, descargarlo, eliminarlo (soft delete) y confirmar que desaparece de la tabla pero el archivo permanece en `backend/uploads/` y las filas permanecen en `document_rows`.
- [x] 10.2 Repetir el intento de registro con `rol: "admin"` vía API directa y confirmar 400 (ya cubierto en 2.5, repetir aquí como parte de la verificación integrada final).
- [x] 10.3 Revisar que no queden identificadores en español fuera de las excepciones documentadas (CSV: `correo/nombre/telefono/ciudad/notas`; auth wire: `nombre/contraseña/confirmarContraseña/rol`) haciendo una búsqueda de texto en `backend/src` y `frontend/src` por los términos ya identificados en este change (`usuarioId`, `nombreOriginal`, `nombreArchivo`, `rutaArchivo`, `numeroRegistros`, `validarFilas`, `rolesPermitidos`, `documentos` como nombre de variable/prop, `errorCarga`, `nombreUsuario`, `formatFecha`, `nombreDescarga`, `eliminarArchivoSiExiste`) y confirmar que ya no aparecen (salvo, si corresponde, en comentarios o en el historial de `openspec/changes/archive/`, que no se tocan).

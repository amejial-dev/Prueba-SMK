## Why

Jiseth revisó el PR anterior y encontró 7 pendientes de calidad/seguridad antes de aceptar la prueba técnica: el borrado de documentos es físico (se pierde el archivo y la fila), el registro no tiene selector de rol en el frontend (aunque `frontend-auth-ui` ya lo exige) sin abrir la puerta a autoasignación de `admin`, el código mezcla español e inglés en identificadores, `.error-message` está triplicado en el CSS, `docker-compose.yml` hardcodea credenciales de la base de datos y no propaga el `.env` del frontend, y la carga de CSV no limita tamaño ni sanea el nombre de archivo (riesgo de path traversal). Hay que resolver los 7 puntos en un solo cambio coherente porque varios se tocan entre sí (p. ej. el selector de rol toca el mismo formulario que ya está listado como reutilizable por `.error-message`, y el barrido de nomenclatura toca los mismos archivos que el soft delete).

**Ajuste 8 (aclaración posterior al feedback inicial):** Jiseth señaló que `design.md` fijaba, como restricción de este change, justo lo contrario de lo pedido: el documento decía "no se migra el proyecto a usar migraciones de Sequelize; se sigue usando `sync()`", cuando el pedido real era adoptar migraciones de Sequelize en un directorio propio (separado de `backend/src/models`). Este `proposal.md` y el resto de artefactos del change se corrigen para reflejar esa intención correctamente.

## What Changes

- **Soft delete de documentos**: `Document` pasa a `paranoid: true` (Sequelize). `DELETE /api/documents/:id` deja de borrar la fila y el archivo físico; solo marca `deletedAt`. El archivo en disco se conserva. El listado (`GET /api/documents`) sigue excluyendo documentos borrados automáticamente (comportamiento nativo de `paranoid`). **BREAKING** (comportamiento): un documento "eliminado" ya no libera espacio en disco ni bloquea recrear un archivo con el mismo nombre físico; esto es intencional.
- **Selector de rol en registro sin autoasignación de admin**: se agrega un `<select>` de rol a `RegisterView.vue` con dos opciones visibles, "Usuario" (seleccionable) y "Administrador" (**disabled**, con nota de que se asigna solo por el equipo del sistema). El valor enviado siempre es `user`. En el backend, `POST /api/auth/register` pasa de *ignorar silenciosamente* cualquier `rol` recibido a **rechazarlo explícitamente con 400** si viene un valor distinto de `user`, y sigue creando el usuario con `rol: 'user'` fijo en el controlador (defensa en profundidad, no depende de la validación). **BREAKING** (comportamiento): antes, enviar `rol: "admin"` producía un registro exitoso silencioso con `rol: "user"`; ahora produce un 400.
- **Nomenclatura en inglés**: se traducen a inglés los identificadores de código (variables, funciones, columnas de modelo, claves JSON de la API de documentos) en backend y frontend, **excepto** (a) las 5 claves del contrato CSV del enunciado (`correo`, `nombre`, `telefono`, `ciudad`, `notas`) y (b) las claves del contrato de autenticación citadas literalmente en el enunciado (`nombre`, `contraseña`, `confirmarContraseña`, `rol` en el body/response de `/api/auth/*`, y la columna `nombre` de `User`). **BREAKING**: la API de documentos cambia claves de respuesta (`nombreOriginal`→`originalName`, `usuarioId`→`userId`, `numeroRegistros`→`recordCount`, `usuario`→`user`, `fechaCarga`→`uploadedAt`); backend y frontend se actualizan juntos en este mismo change, no hay clientes externos que dependan del contrato viejo.
- **Estilos de error unificados**: `.error-message` se define una sola vez en `frontend/src/styles/glass.css` (global) y se elimina de los `<style scoped>` de `LoginView.vue`, `RegisterView.vue` y `DashboardView.vue`.
- **Variables de entorno del servicio `db`**: `docker-compose.yml` deja de hardcodear `POSTGRES_DB/POSTGRES_USER/POSTGRES_PASSWORD`; el servicio `db` pasa a usar `env_file: ./backend/.env`, y `backend/.env(.example)` gana las claves `POSTGRES_DB/POSTGRES_USER/POSTGRES_PASSWORD` (mismo valor que `DB_NAME/DB_USER/DB_PASSWORD`, documentado que deben mantenerse en sync).
- **`.env` del frontend en Docker**: el servicio `frontend` de `docker-compose.yml` gana `env_file: ./frontend/.env`, para que el `cp frontend/.env.example frontend/.env` documentado en el README sí tenga efecto dentro del contenedor.
- **Límites y saneo en la carga de CSV**: `multer` en `upload.middleware.js` gana `limits.fileSize` (configurable por `MAX_CSV_FILE_SIZE_MB`, default `5`), y el nombre de archivo guardado en disco se sanea (`path.basename` + reemplazo de caracteres no seguros) antes de concatenarlo con el timestamp. `error.middleware.js` gana manejo explícito de `multer.MulterError` (incluye `LIMIT_FILE_SIZE`) para responder 400 en vez de 500.
- **Migraciones de Sequelize en directorio propio (ajuste 8)**: se agrega `sequelize-cli` y un directorio `backend/src/database/migrations/` con una migración por tabla (`users`, `documents`, `document_rows`) que reproduce el esquema exacto que antes creaba `sequelize.sync()`. `backend/src/index.js` deja de llamar `sequelize.sync()`; el esquema se aplica con `sequelize-cli db:migrate`, que ahora corre automáticamente antes de levantar el servidor (`npm run start`/`npm run dev`). **BREAKING** (solo para entornos ya levantados antes de este ajuste): cualquier base de datos creada con `sync()` no tiene la tabla `SequelizeMeta`, así que requiere recrear el volumen de Postgres una vez (`docker compose down -v`) para que las migraciones puedan aplicarse desde cero; los entornos nuevos no se ven afectados.

## Capabilities

### New Capabilities
(ninguna — todos los ajustes son modificaciones de capacidades existentes)

### Modified Capabilities
- `csv-documents`: "Eliminación restringida a administradores" pasa a ser un borrado lógico (se conserva el archivo físico y la fila borrada queda oculta del listado); se documenta que las filas (`DocumentRow`) también se conservan al no ejecutarse un `DELETE` físico.
- `user-auth`: "Registro de usuario" cambia el escenario de intento de autoasignar `admin`: de "el sistema ignora el campo" a "el sistema rechaza la petición con 400 si `rol` no es `user`".
- `frontend-auth-ui`: "Registro desde el frontend" se actualiza para reflejar que el selector de rol ofrece únicamente `user` como opción seleccionable (la opción `admin` se muestra deshabilitada), reconciliando el requisito ya existente ("selección de rol (user o admin)") con la política de no-autoasignación.
- `csv-dashboard-ui`: "Listado de documentos en tabla" se aclara para indicar que solo se listan documentos no eliminados (borrado lógico).

## Impact

**Backend (código):**
- `backend/src/models/document.model.js` — `paranoid: true`; renombrar `nombreOriginal→originalName`, `nombreArchivo→fileName`, `rutaArchivo→filePath`, `numeroRegistros→recordCount`, `usuarioId→userId`.
- `backend/src/models/index.js` — actualizar `foreignKey: 'usuarioId'` → `'userId'` en ambas asociaciones.
- `backend/src/controllers/document.controller.js` — quitar el borrado físico del archivo en `remove()`; renombrar identificadores internos y claves de respuesta JSON según el punto anterior.
- `backend/src/controllers/auth.controller.js` — desestructurar `req.body` a variables internas en inglés; mantener las claves de wire (`nombre`, `contraseña`, `confirmarContraseña`) sin cambio; seguir forzando `rol: 'user'` en la creación.
- `backend/src/routes/auth.routes.js` — agregar validación `body('rol').optional().isIn(['user'])` con mensaje de rechazo explícito.
- `backend/src/utils/csvValidator.js` — renombrar función y variables internas (`validarFilas→validateRows`, etc.); las claves de fila del CSV (`correo`, `nombre`, `telefono`, `ciudad`, `notas`) no cambian.
- `backend/src/middlewares/auth.middleware.js` — renombrar `rolesPermitidos→allowedRoles`.
- `backend/src/middlewares/upload.middleware.js` — agregar `limits.fileSize`, sanear `filename`.
- `backend/src/middlewares/error.middleware.js` — manejar `multer.MulterError`.
- `backend/.env.example` — agregar `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `MAX_CSV_FILE_SIZE_MB`.
- `backend/src/index.js` — quitar `sequelize.sync()`.
- `backend/.sequelizerc` (nuevo), `backend/src/config/database.cli.js` (nuevo), `backend/src/database/migrations/*.js` (nuevos, 3 archivos) — ver Decisión 8 de `design.md`.
- `backend/package.json` — agregar `sequelize-cli` como devDependency; scripts `migrate`, `migrate:undo`, `migrate:undo:all`, `migration:generate`; `start`/`dev` corren `migrate` antes de levantar el servidor.

**Frontend (código):**
- `frontend/src/views/RegisterView.vue` — agregar `<select>` de rol (admin disabled); quitar `.error-message` del `<style scoped>`.
- `frontend/src/views/LoginView.vue` — quitar `.error-message` del `<style scoped>`.
- `frontend/src/views/DashboardView.vue` — quitar `.error-message` del `<style scoped>`; renombrar `documentos→documents`, `errorCarga→uploadError`, y consumir las nuevas claves de la API (`originalName`, `userId`, `recordCount`, `user`, `uploadedAt`).
- `frontend/src/components/DocumentsTable.vue` — renombrar prop `documentos→documents`, métodos y referencias a las nuevas claves.
- `frontend/src/components/CsvUploader.vue` — renombrar variables internas (`archivo→file`, `detalle→errorDetail`).
- `frontend/src/styles/glass.css` — agregar la definición global de `.error-message`.

**Infraestructura:**
- `docker-compose.yml` — servicio `db`: quitar `environment` hardcodeado, agregar `env_file: ./backend/.env`; servicio `frontend`: agregar `env_file: ./frontend/.env`.
- `README.md` — actualizar tabla de variables de entorno y sección de API para reflejar las nuevas claves de wire de documentos y las variables `POSTGRES_*`/`MAX_CSV_FILE_SIZE_MB`.

**Specs:**
- `openspec/specs/csv-documents/spec.md`, `openspec/specs/user-auth/spec.md`, `openspec/specs/frontend-auth-ui/spec.md`, `openspec/specs/csv-dashboard-ui/spec.md`.

**No afecta:** esquema de `DocumentRow` (columnas del contrato CSV sin cambio), middleware `authenticate`, lógica de JWT, Dockerfiles.

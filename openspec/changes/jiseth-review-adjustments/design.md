## Context

Ver `proposal.md` para el motivo de cada uno de los 7 ajustes. Este documento fija las decisiones técnicas que dejaron ambigüedad en la petición original del cliente (Jiseth), para que `tasks.md` no deje pasos abiertos a interpretación.

Restricciones relevantes ya existentes en el repo (al momento de escribir este documento, antes del ajuste 8 de la revisión de Jiseth):
- El proyecto no usaba migraciones de Sequelize; el esquema se creaba/actualizaba con `sequelize.sync()` en `backend/src/index.js`. Este punto quedó corregido por el ajuste 8 (ver Decisión 8): el proyecto ahora usa migraciones de Sequelize en un directorio propio, y `sync()` se elimina de `backend/src/index.js`.
- `docker-compose.yml` monta el código por volumen (`./backend:/app`, `./frontend:/app`) y usa `env_file` para el servicio `backend`, pero no para `db` ni `frontend`.
- Un change previo y ya archivado (`openspec/changes/archive/2026-09-04-restrict-admin-self-registration`) fijó la política "el registro público ignora silenciosamente cualquier `rol` recibido". La spec `frontend-auth-ui` nunca se actualizó en ese change y todavía exige "selección de rol (user o admin)" en el formulario — es una inconsistencia preexistente entre specs que este change resuelve.

## Goals / Non-Goals

**Goals:**
- Resolver los 7 puntos de revisión originales introduciendo la menor cantidad de herramientas o dependencias nuevas posible (no se agrega librería de sanitización, etc. — se resuelve con lo que ya trae el stack: Sequelize `paranoid`, `path.basename`, `multer.MulterError`, `env_file`/interpolación de docker-compose). La única dependencia nueva de todo el change es `sequelize-cli`, exigida explícitamente por el ajuste 8 (migraciones en directorio aparte).
- Dejar un criterio único y no ambiguo de qué identificadores se traducen a inglés y cuáles se quedan en español, aplicable de forma mecánica archivo por archivo.
- Que el selector de rol satisfaga la spec `frontend-auth-ui` (que ya pedía un selector) sin reabrir la vulnerabilidad de autoasignación de `admin` que el change anterior cerró.

**Non-Goals:**
- No se introduce un sistema de roles más allá de `user`/`admin` (el enum de `User.rol` no cambia).
- No se agrega un endpoint para "restaurar" un documento eliminado lógicamente (fuera de alcance; el borrado lógico solo debe ocultar, no se pide una UI de recuperación).
- No se migra el modelo de roles/permisos ni se introduce un ORM distinto de Sequelize; el ajuste 8 adopta migraciones (mecanismo nativo de Sequelize), no una herramienta externa.
- No se traducen las claves de wire del contrato de autenticación (`nombre`, `contraseña`, `confirmarContraseña`, `rol`) ni las del CSV — ver Decisión 3.

## Decisions

### 1. Soft delete con `paranoid: true` de Sequelize
Se activa `paranoid: true` en `Document.init(...)` en lugar de agregar una columna manual `isDeleted`. Sequelize con `paranoid: true`:
- Agrega automáticamente la columna `deletedAt` (mapeada como `deleted_at` si se usara `underscored`, pero este proyecto no usa `underscored`, así que la columna queda `deletedAt` igual que las de `timestamps`).
- Hace que `destroy()` ejecute un `UPDATE ... SET "deletedAt" = NOW()` en vez de un `DELETE`.
- Hace que `findAll()`/`findByPk()`/`findOne()` excluyan automáticamente las filas con `deletedAt` no nulo, sin tocar los `WHERE` existentes en `list()`, `download()` ni `remove()`.
- La columna `deletedAt` se agrega explícitamente en la migración `create-documents` (ver Decisión 8), no vía `sync()`.

Alternativa descartada: columna manual `isDeleted: BOOLEAN` + filtrar a mano con `where: { isDeleted: false }` en cada consulta. Se descarta porque obliga a tocar `list()`, `download()` y cualquier consulta futura para no olvidar el filtro (riesgo de fuga de datos borrados), mientras que `paranoid` lo hace transparente y a prueba de olvidos.

Consecuencia sobre `DocumentRow`: la asociación `Document.hasMany(DocumentRow, { onDelete: 'CASCADE' })` es un `ON DELETE CASCADE` a nivel de FK en la base de datos, que solo se dispara con un `DELETE` físico. Con `paranoid: true` ese `DELETE` físico ya no ocurre al llamar `documento.destroy()`, así que las filas de `DocumentRow` se conservan intactas (comportamiento deseado: "conservar el archivo físico" implica también conservar los datos parseados). No hace falta tocar la asociación.

Consecuencia sobre `document.controller.js#remove`: se elimina la línea que borra el archivo físico (`eliminarArchivoSiExiste(rutaArchivo)` tras el `destroy()`). El `destroy()` ya no borra la fila físicamente, así que no hay necesidad (ni se debe) borrar el archivo del disco.

### 2. Selector de rol: opción "Administrador" visible pero deshabilitada + rechazo explícito en servidor
Dos capas, ninguna confía en la otra:
- **Frontend** (`RegisterView.vue`): un `<select>` con `<option value="user">Usuario</option>` y `<option value="admin" disabled>Administrador</option>`, más un texto de ayuda ("El rol de administrador se asigna solo por el equipo del sistema"). El `v-model` por defecto es `'user'`; como la opción admin está `disabled`, el navegador no permite seleccionarla, así que el payload enviado siempre trae `rol: 'user'`.
- **Backend** (defensa en profundidad, porque el frontend es manipulable): `auth.routes.js` agrega `body('rol').optional().isIn(['user']).withMessage('rol solo puede ser "user" en el registro público.')`. El controlador (`auth.controller.js`) sigue sin leer el valor validado de `rol` para construir el usuario — crea siempre con `rol: 'user'` literal — de modo que aunque alguien lograra pasar la validación con un valor manipulado, el valor efectivo seguiría fijo en el código, no en el input.

Se descarta la alternativa de "ignorar silenciosamente" (comportamiento actual, heredado del change `restrict-admin-self-registration`) porque, sumada al nuevo selector visible, generaría una experiencia confusa: alguien que lograra forzar `rol: "admin"` por API directa (evitando la UI) recibiría un 200 con un usuario creado en `user` sin ninguna señal de que su valor fue descartado. Rechazar con 400 es más seguro (deja rastro claro del intento) y más simple de testear.

Este comportamiento reemplaza el fijado por el change `2026-09-04-restrict-admin-self-registration` (que decía "el sistema ignora ese campo por completo"); el delta de `user-auth` en este change lo actualiza explícitamente.

### 3. Regla de traducción de identificadores: contrato de wire vs. nombre interno
Se traduce a inglés **todo identificador de código** (variables, propiedades de modelos, columnas, nombres de función, claves JSON) **excepto** dos conjuntos de campos que están fijados textualmente por el enunciado de la prueba técnica (citado en `openspec/config.yaml`) y por lo tanto son parte del contrato de datos del dominio, no una elección de nomenclatura interna:
1. Las 5 columnas del CSV de contactos: `correo`, `nombre`, `telefono`, `ciudad`, `notas` (en `DocumentRow.model.js`, `csvValidator.js`, y el texto de ayuda de `CsvUploader.vue`).
2. Los campos de wire de `POST /api/auth/register` y `/login`: `nombre`, `contraseña`, `confirmarContraseña`, `rol` (en el body de la petición y en la respuesta), y la columna `nombre` del modelo `User` que los respalda directamente.

Todo lo demás se traduce, incluyendo (esto sí cambia el contrato de la API, ver Riesgo más abajo):
- Claves JSON de la API de **documentos** (`nombreOriginal→originalName`, `usuarioId→userId`, `numeroRegistros→recordCount`, `usuario→user`, `fechaCarga→uploadedAt`) — estas NO están mandadas por el enunciado, son nombres que eligió una iteración anterior del código.
- Identificadores internos dentro de `auth.controller.js` que no son parte del wire (`existente→existingUser`, `passwordValida→isPasswordValid`), aunque el body siga leyendo `nombre`/`contraseña`/`confirmarContraseña`/`rol`. Ejemplo de patrón a aplicar: desestructurar una vez a variables en inglés y trabajar con esas variables el resto de la función.
- Todos los identificadores internos de `csvValidator.js`, `document.controller.js`, `auth.middleware.js`, y las vistas/componentes del frontend, salvo las claves de dominio mencionadas arriba.

Los mensajes de error dirigidos a la persona usuaria (strings literales) y las etiquetas de la UI se mantienen en español — este punto trata solo de identificadores de código, no de la copy visible.

Alternativa descartada: traducir también `nombre`/`contraseña`/`confirmarContraseña`/`rol` del contrato de auth a inglés (`username`/`password`/`confirmPassword`/`role`). Se descarta porque `openspec/config.yaml` cita esos nombres como parte literal del enunciado del cliente (igual que las columnas del CSV), y romper ese contrato no aporta valor frente al riesgo de invalidar la entrega respecto al enunciado original.

### 4. `.error-message` global sin variantes de margen
Se define una sola regla en `frontend/src/styles/glass.css`:
```css
.error-message {
  color: var(--error-color);
  font-size: 0.9rem;
  margin: 0.5rem 0;
}
```
Los tres usos actuales tienen márgenes ligeramente distintos (`-0.5rem 0 1rem` en Login/Register, `1rem 0 0` en Dashboard) puramente por el layout local de cada formulario. Se unifica a `0.5rem 0`, que es visualmente aceptable en los tres contextos (separación simétrica arriba/abajo) sin necesitar un modificador adicional por vista. `glass.css` ya se importa una sola vez en `frontend/src/main.js` (`import './styles/glass.css'`), así que no hace falta ningún import nuevo en los componentes.

### 5. Variables del servicio `db` en `docker-compose.yml`: `env_file` con claves `POSTGRES_*` propias en `backend/.env`
El problema real: Postgres (imagen oficial `postgres:16-alpine`) espera las variables `POSTGRES_DB`/`POSTGRES_USER`/`POSTGRES_PASSWORD`, mientras que `backend/.env` define `DB_NAME`/`DB_USER`/`DB_PASSWORD` (los nombres que lee Sequelize en `backend/src/config/database.js`). Los nombres no coinciden, así que un simple `env_file: ./backend/.env` en el servicio `db` no bastaría para poblar `POSTGRES_*` — y la interpolación `${DB_NAME}` en el YAML tampoco funciona aquí, porque docker-compose solo interpola `${VAR}` del YAML usando variables del entorno del proceso `docker compose` (shell) o de un `.env` en la RAÍZ del repo, nunca usando el contenido de un `env_file` de un servicio (ese mecanismo solo inyecta variables dentro del contenedor, no las expone para interpolar el propio archivo).

Decisión: agregar las claves `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` directamente a `backend/.env.example` (con los mismos valores que `DB_NAME`/`DB_USER`/`DB_PASSWORD`) y usar `env_file: - ./backend/.env` en el servicio `db` de `docker-compose.yml`, quitando el bloque `environment` hardcodeado. Así Postgres recibe sus variables tal cual del mismo archivo que ya es la fuente de verdad del proyecto, sin necesitar interpolación de docker-compose ni un `.env` nuevo en la raíz. El trade-off aceptado es mantener 6 variables (3 pares equivalentes) en el mismo archivo en vez de 3 — se documenta en `backend/.env.example` con un comentario indicando que `POSTGRES_*` debe coincidir con `DB_NAME/DB_USER/DB_PASSWORD`.

Alternativas descartadas:
- Crear un `.env` en la raíz del repo leído automáticamente por docker-compose: introduce un tercer archivo de configuración (raíz + backend + frontend) para un proyecto que hoy solo tiene dos, y el README tendría que documentar un `cp` adicional.
- Reescribir `backend/src/config/database.js` para leer `POSTGRES_*` en vez de `DB_*`: innecesario y fuera de alcance de este ajuste puntual.

### 6. `env_file` en el servicio `frontend`
Se agrega `env_file: - ./frontend/.env` al servicio `frontend`. Aunque Vite en modo dev-server puede leer `frontend/.env` directamente del filesystem montado por el volumen `./frontend:/app`, declarar `env_file` explícitamente (a) alinea el servicio `frontend` con `backend`/`db`, que ya lo usan, (b) documenta la intención en el propio `docker-compose.yml` en vez de depender implícitamente del comportamiento de Vite + volúmenes, y (c) cubre el caso de que el arranque del contenedor (`npm run dev -- --host`) necesite alguna variable de entorno de proceso además de las que Vite inyecta en el bundle. No se elimina el fallback `'http://localhost:3000/api'` en `frontend/src/services/api.js`: sigue siendo necesario para `npm run dev` fuera de Docker (documentado en el README como flujo soportado). Se documenta explícitamente en `frontend/.env.example` que `VITE_API_URL` debe existir en `frontend/.env` para el flujo con Docker.

### 7. Límite de tamaño y saneo de nombre en `multer`
- `limits: { fileSize: Number(process.env.MAX_CSV_FILE_SIZE_MB || 5) * 1024 * 1024 }` en la configuración de `multer(...)`.
- Saneo del nombre de archivo en la función `filename` del `diskStorage`: `const safeOriginalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, '_');` y luego `const uniqueName = \`${Date.now()}-${safeOriginalName}\`;`. `path.basename` elimina cualquier segmento de directorio (`../`, rutas absolutas); el `replace` elimina espacios, acentos y símbolos que podrían causar problemas en algunos sistemas de archivos o en cabeceras HTTP al descargar.
- Manejo de `multer.MulterError` en `error.middleware.js`: se agrega un bloque `if (err instanceof multer.MulterError) { ... }` antes del `console.error` genérico, que mapea `err.code === 'LIMIT_FILE_SIZE'` a un 400 con mensaje indicando el límite configurado, y cualquier otro código de `MulterError` a un 400 genérico con `err.message`.

### 8. Migraciones de Sequelize en directorio propio, reemplazando `sync()`
Jiseth aclaró en una segunda ronda de feedback que el punto de la revisión original pedía exactamente lo contrario de lo que este documento fijaba al principio: el proyecto debía **adoptar** migraciones de Sequelize, en un directorio separado del de los modelos, no seguir usando `sync()`. Cambios:
- Se agrega `sequelize-cli` (`^6.6.5`) como `devDependency` de `backend`.
- `.sequelizerc` fija las rutas: `migrations-path` → `backend/src/database/migrations`, `seeders-path` → `backend/src/database/seeders`, `config` → `backend/src/config/database.cli.js`, `models-path` → `backend/src/models` (sin mover los modelos, que siguen siendo los que usa la app en runtime vía `Model.init`).
- `backend/src/config/database.cli.js` es un archivo de configuración nuevo, exclusivo para `sequelize-cli` (formato plano `{ development, test, production }` que exige la CLI), que lee las mismas variables `DB_*` de `backend/.env` que ya usa `backend/src/config/database.js` (el archivo de conexión en runtime no se toca).
- Se crean 3 migraciones en `backend/src/database/migrations/` que recrean el esquema existente exactamente como lo dejaba `sync()` antes de este ajuste: `create-users`, `create-documents` (incluye `deletedAt`, de la Decisión 1) y `create-document-rows` (en ese orden, por las FK `documents.userId → users.id` y `document_rows.documentId → documents.id`, ambas `ON DELETE CASCADE` igual que las asociaciones ya definidas en `backend/src/models/index.js`).
- `backend/src/index.js` deja de llamar `sequelize.sync()`; solo hace `sequelize.authenticate()` antes de levantar el servidor. Aplicar el esquema pasa a ser responsabilidad explícita de `sequelize-cli db:migrate`.
- `backend/package.json`: los scripts `start` y `dev` corren `npm run migrate` antes de levantar el servidor (`nodemon`/`node`), preservando el mismo comportamiento "levantar y ya queda listo" que daba `sync()` en `docker compose up`, pero ahora vía migraciones versionadas. Se agregan también `migrate:undo`, `migrate:undo:all` y `migration:generate` para el ciclo de vida normal de migraciones futuras.
- No fue necesario tocar `docker-compose.yml` ni el `Dockerfile` del backend: el `CMD ["npm", "run", "dev"]` ya existente ejecuta la migración automáticamente al arrancar el contenedor gracias al cambio en el script `dev`.

Alternativa descartada: mantener `sync()` para desarrollo y agregar migraciones solo como capa adicional "documental". Se descarta porque el pedido explícito era reemplazar `sync()`, y mantener ambos mecanismos activos a la vez es la causa típica de esquemas desincronizados entre entornos (uno generado por `sync()`, otro por migración) — exactamente lo que las migraciones existen para evitar.

## Risks / Trade-offs

- [Cambiar las claves JSON de la API de documentos es una ruptura de contrato] → Mitigación: backend y frontend se actualizan en el mismo change/PR; no hay otros consumidores del API en esta fase de prueba técnica (confirmado por el alcance del proyecto).
- [`paranoid: true` deja crecer la tabla `documents` indefinidamente, ya que nunca se purgan filas eliminadas] → Aceptado como trade-off: el volumen de datos de una prueba técnica es trivial; no se implementa purga automática (fuera de alcance).
- [Dos nombres de variable para las mismas credenciales de DB (`DB_*` y `POSTGRES_*`) en `backend/.env` pueden desincronizarse si alguien edita solo uno] → Mitigación: comentario explícito en `backend/.env.example` junto a las variables `POSTGRES_*` indicando que deben coincidir con `DB_NAME/DB_USER/DB_PASSWORD`.
- [Rechazar `rol` inválido con 400 en vez de ignorarlo es un cambio de comportamiento respecto al change anterior] → Mitigación: documentado explícitamente en el delta de `user-auth` y en el `Why`/`What Changes` de este `proposal.md`, y es un cambio de comportamiento de un endpoint interno de una prueba técnica, sin consumidores externos.
- [Cualquier base de datos local/de un entorno ya levantada con `sync()` (antes del ajuste 8) no tiene la tabla `SequelizeMeta` que usan las migraciones, así que `sequelize-cli db:migrate` intentará crear tablas que ya existen y fallará con "relation already exists"] → Mitigación: es una transición única. Se documenta en el `README.md` y en `tasks.md` (tarea 11.5) que, tras este ajuste, cualquier entorno existente debe recrear el volumen de Postgres una sola vez (`docker compose down -v && docker compose up --build`) para partir de una base vacía que las migraciones puedan poblar desde cero; no aplica a entornos nuevos, que nunca corrieron `sync()`.

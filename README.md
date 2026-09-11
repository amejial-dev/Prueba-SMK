# Prueba Técnica: Full Stack Developer (Node.js & Vue 3)

Gestor de documentos CSV con autenticación JWT y roles de usuario. Cualquier usuario autenticado puede subir, listar y descargar CSV de contactos; solo los administradores pueden eliminarlos.

## Stack

- **Backend**: Node.js + Express 5 + Sequelize (ORM) + PostgreSQL 16
- **Autenticación**: JWT (`jsonwebtoken`) + hashing con `bcryptjs`
- **Frontend**: Vue 3 (Option API) + Vue Router + Axios — UI glassmorphism
- **Infraestructura**: Docker + docker-compose (servicios `db`, `backend`, `frontend`)
- **Metodología**: desarrollo spec-driven con [OpenSpec](openspec/) — cada capability tiene su especificación en `openspec/specs/`, y cada cambio quedó documentado y archivado en `openspec/changes/archive/`

## Estructura

```
.
├── backend/          # API REST (Express + Sequelize)
│   └── src/
│       ├── config/       # conexión a la base de datos (runtime + config de sequelize-cli)
│       ├── controllers/  # lógica de negocio (auth, documents)
│       ├── database/
│       │   └── migrations/  # migraciones de Sequelize (sequelize-cli), separadas de los modelos
│       ├── middlewares/  # auth (JWT), authorize (RBAC), upload (multer), error
│       ├── models/       # User, Document, DocumentRow (Sequelize)
│       ├── routes/       # /api/auth, /api/documents
│       └── seeders/      # createAdmin.js (aprovisionamiento de administradores)
├── frontend/         # SPA (Vue 3)
│   └── src/
│       ├── components/   # GlassCard, CsvUploader, DocumentsTable
│       ├── views/        # LoginView, RegisterView, DashboardView
│       ├── services/     # api.js (Axios), session.js (sesión/JWT)
│       └── router/       # guard de autenticación
├── openspec/         # specs, propuestas y changes archivados
└── docker-compose.yml
```

## Cómo levantar el proyecto

1. Copiar las variables de entorno de ejemplo:

   ```
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. Levantar todo con Docker:

   ```
   docker compose up --build
   ```

   - Frontend: http://localhost:5173
   - Backend / API: http://localhost:3000/api
   - PostgreSQL: localhost:5432

   El esquema de la base de datos se crea con **migraciones de Sequelize** (`backend/src/database/migrations/`, ejecutadas con `sequelize-cli`), no con `sequelize.sync()`. El script `dev`/`start` de `backend` corre `npm run migrate` automáticamente antes de levantar el servidor, así que no hace falta ningún paso manual en un entorno nuevo.

   > **Si ya tenías el proyecto levantado antes de este cambio** (esquema creado por `sync()`): la base existente no tiene la tabla `SequelizeMeta` que usan las migraciones, así que hay que recrear el volumen una sola vez con `docker compose down -v && docker compose up --build`.

3. Crear el usuario administrador: el formulario de registro incluye un selector de rol (`Usuario` / `Administrador`) y el usuario creado queda con el rol elegido. También se puede crear/promover un admin por línea de comandos con el seeder:

   ```
   ADMIN_SEED_NOMBRE=admin ADMIN_SEED_PASSWORD=algo-seguro docker compose exec backend npm run seed:admin
   ```

   Alternativamente, se pueden fijar `ADMIN_SEED_NOMBRE` y `ADMIN_SEED_PASSWORD` en `backend/.env` (ver `.env.example`) y correr solo `docker compose exec backend npm run seed:admin`.

   Si el usuario `ADMIN_SEED_NOMBRE` ya existe, el seeder lo promueve a `admin`; si no existe, lo crea. Se puede ejecutar varias veces sin error.

## Variables de entorno (`backend/.env`)

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto del servidor Express | `3000` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Conexión a PostgreSQL (las lee Sequelize) | ver `.env.example` |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Credenciales que lee el contenedor oficial de Postgres (`env_file` del servicio `db`) — deben coincidir con `DB_NAME`/`DB_USER`/`DB_PASSWORD` | ver `.env.example` |
| `JWT_SECRET` | Secreto para firmar/verificar los JWT | cambiar en producción |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | `1d` (1 día) |
| `MAX_CSV_FILE_SIZE_MB` | Tamaño máximo permitido para el CSV subido | `5` |
| `ADMIN_SEED_NOMBRE` | Nombre del usuario a crear/promover a `admin` | usado solo por `npm run seed:admin`, ver `.env.example` |
| `ADMIN_SEED_PASSWORD` | Contraseña del usuario admin sembrado | usado solo por `npm run seed:admin`, ver `.env.example` |

## Migraciones de base de datos

El esquema se gestiona con migraciones de Sequelize (`sequelize-cli`), ubicadas en `backend/src/database/migrations/` (directorio separado de `backend/src/models/`, donde viven las definiciones de modelo que usa la app en runtime). Comandos disponibles en `backend` (local o vía `docker compose exec backend <comando>`):

| Comando | Efecto |
|---|---|
| `npm run migrate` | Aplica las migraciones pendientes (se ejecuta automáticamente al arrancar con `npm start`/`npm run dev`) |
| `npm run migrate:undo` | Revierte la última migración aplicada |
| `npm run migrate:undo:all` | Revierte todas las migraciones |
| `npm run migration:generate -- --name nombre-de-la-migracion` | Crea un archivo de migración nuevo en blanco |

## Roles y permisos (RBAC)

| Acción | `user` | `admin` |
|---|---|---|
| Registrarse / iniciar sesión | ✔ | ✔ |
| Subir un CSV | ✔ | ✔ |
| Ver el listado de documentos | ✔ | ✔ |
| Descargar un documento | ✔ | ✔ |
| Eliminar un documento | ✘ (403) | ✔ (borrado lógico) |

Eliminar un documento es un **borrado lógico** (soft delete): la fila queda marcada como eliminada (`deletedAt`) y desaparece del listado, pero el archivo original permanece en `backend/uploads/` y las filas parseadas del CSV (`document_rows`) no se borran.

## API principal

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Crea un usuario (`nombre`, `contraseña`, `confirmarContraseña`, `rol` opcional: `user` o `admin`, por defecto `user`) |
| `POST` | `/api/auth/login` | — | Devuelve un JWT + datos del usuario |
| `POST` | `/api/documents` | JWT | Sube y valida un CSV (campo multipart `file`, máx. `MAX_CSV_FILE_SIZE_MB`) |
| `GET` | `/api/documents` | JWT | Lista los documentos no eliminados: `{ id, originalName, user, uploadedAt, recordCount }` |
| `GET` | `/api/documents/:id/download` | JWT | Descarga el archivo original (`:id` debe ser numérico, si no responde **400**) |
| `DELETE` | `/api/documents/:id` | JWT + `admin` | Marca el documento como eliminado (borrado lógico); el archivo físico y las filas de `document_rows` se conservan (`:id` debe ser numérico, si no responde **400**) |

## Desarrollo local sin Docker (opcional)

```
cd backend && npm run dev
cd frontend && npm run dev
```

(requiere una instancia de PostgreSQL accesible según las variables de `backend/.env`)

## Estado

- [x] Registro de usuarios (nombre, contraseña, confirmar contraseña; rol siempre "user", admin vía seeder `npm run seed:admin`)
- [x] Login con JWT
- [x] Modelo de documentos CSV
- [x] Endpoint de carga y validación de CSV
- [x] Control de acceso por rol (RBAC)
- [x] Vistas de Login / Registro
- [x] Dashboard: carga (drag & drop), tabla de documentos, descarga, eliminación (admin)
- [x] Verificación end-to-end contra la stack real (`docker compose up`)

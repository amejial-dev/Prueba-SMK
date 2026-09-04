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
│       ├── config/       # conexión a la base de datos
│       ├── controllers/  # lógica de negocio (auth, documents)
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

3. Crear el usuario administrador (el registro público solo crea usuarios con `rol: 'user'`; `admin` se asigna con este seeder, nunca desde el formulario de registro):

   ```
   ADMIN_SEED_NOMBRE=admin ADMIN_SEED_PASSWORD=algo-seguro docker compose exec backend npm run seed:admin
   ```

   Si el usuario `ADMIN_SEED_NOMBRE` ya existe, el seeder lo promueve a `admin`; si no existe, lo crea. Se puede ejecutar varias veces sin error.

## Variables de entorno (`backend/.env`)

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto del servidor Express | `3000` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Conexión a PostgreSQL | ver `.env.example` |
| `JWT_SECRET` | Secreto para firmar/verificar los JWT | cambiar en producción |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | `1d` (1 día) |

## Roles y permisos (RBAC)

| Acción | `user` | `admin` |
|---|---|---|
| Registrarse / iniciar sesión | ✔ | ✔ |
| Subir un CSV | ✔ | ✔ |
| Ver el listado de documentos | ✔ | ✔ |
| Descargar un documento | ✔ | ✔ |
| Eliminar un documento | ✘ (403) | ✔ |

## API principal

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Crea un usuario (`nombre`, `contraseña`, `confirmarContraseña`); siempre `rol: 'user'` |
| `POST` | `/api/auth/login` | — | Devuelve un JWT + datos del usuario |
| `POST` | `/api/documents` | JWT | Sube y valida un CSV (campo multipart `file`) |
| `GET` | `/api/documents` | JWT | Lista todos los documentos cargados |
| `GET` | `/api/documents/:id/download` | JWT | Descarga el archivo original |
| `DELETE` | `/api/documents/:id` | JWT + `admin` | Elimina un documento (y sus filas, en cascada) |

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

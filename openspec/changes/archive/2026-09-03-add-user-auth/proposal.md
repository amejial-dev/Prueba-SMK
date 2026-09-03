## Why

La aplicación no tiene forma de identificar usuarios ni de distinguir permisos. Todo lo demás (carga de CSV, control de quién puede eliminar registros) depende de tener registro, login y un token verificable primero.

## What Changes

- Modelo `User` en Sequelize (`nombre`, `passwordHash`, `rol`) con `rol` restringido a `user` | `admin`.
- Endpoint `POST /api/auth/register`: valida `nombre`, `contraseña`, `confirmar contraseña` (deben coincidir), `rol`; guarda el hash con bcryptjs.
- Endpoint `POST /api/auth/login`: valida credenciales y retorna un JWT firmado (payload: `id`, `nombre`, `rol`).
- Middleware `authenticate`: verifica el JWT del header `Authorization: Bearer <token>` y adjunta el usuario a `req.user`.
- Middleware `authorize(roles)`: rechaza con 403 si `req.user.rol` no está en `roles` permitidos (se usará luego para RBAC de eliminación).
- Manejo de errores de validación consistente (400 con detalle de campos) reutilizable para futuras capacidades.

## Capabilities

### New Capabilities
- `user-auth`: registro, login con JWT, y middlewares de autenticación/autorización por rol.

### Modified Capabilities
(ninguna — es la primera capability del proyecto)

## Impact

- Archivos nuevos: `backend/src/models/user.model.js`, `backend/src/models/index.js`, `backend/src/controllers/auth.controller.js`, `backend/src/routes/auth.routes.js`, `backend/src/middlewares/auth.middleware.js`, `backend/src/middlewares/error.middleware.js`.
- Archivos modificados: `backend/src/index.js` (montar rutas `/api/auth`, cargar modelos, `sequelize.sync()`).
- Dependencias: ya instaladas (`jsonwebtoken`, `bcryptjs`, `express-validator`, `sequelize`, `pg`).
- No afecta frontend todavía (se cubre en un change aparte).

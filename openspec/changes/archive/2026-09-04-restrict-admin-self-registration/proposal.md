## Why

El endpoint público `POST /api/auth/register` acepta hoy un campo `rol` (`user` | `admin`) enviado por quien se registra. Eso permite que cualquier persona sin sesión ni permisos se autoasigne el rol `admin` y obtenga acceso a la acción destructiva de eliminar documentos (`DELETE /api/documents/:id`). Ese campo se dejó abierto originalmente solo para poder probar el flujo de RBAC durante el desarrollo, no como diseño final. Hay que cerrarlo: el rol `admin` solo debe poder asignarse desde la base de datos o mediante un seeder controlado por quien opera el sistema, nunca desde el formulario público de registro.

## What Changes

- `POST /api/auth/register` deja de aceptar/leer `rol` del body. Todo registro público crea el usuario con `rol: 'user'` fijo en el backend.
- Se elimina la validación de `rol` en `backend/src/routes/auth.routes.js` (ya no hay campo que validar).
- Se agrega un seeder de línea de comandos (`backend/src/seeders/createAdmin.js`, ejecutable con `npm run seed:admin`) que crea o promueve un usuario con `rol: 'admin'` directamente contra la base de datos, leyendo `nombre` y `contraseña` de variables de entorno o argumentos, para uso exclusivo de quien despliega/opera el proyecto.
- El frontend (`RegisterView.vue`) elimina el selector de rol del formulario de registro; el registro ya no envía `rol` en el payload.
- Se actualiza la especificación `user-auth` para reflejar que el registro público siempre crea `rol: 'user'`, y que `admin` es un rol de aprovisionamiento manual (DB/seeder).

## Capabilities

### Modified Capabilities
- `user-auth`: el requisito "Registro de usuario" cambia — ya no acepta `rol` como entrada; el rol de administrador pasa a asignarse fuera del flujo de registro (DB directa o seeder).

## Impact

- Archivos modificados: `backend/src/controllers/auth.controller.js`, `backend/src/routes/auth.routes.js`, `frontend/src/views/RegisterView.vue`, `openspec/config.yaml` (actualizar la regla de dominio de registro), `openspec/specs/user-auth/spec.md`.
- Archivos nuevos: `backend/src/seeders/createAdmin.js`, entrada `seed:admin` en `backend/package.json`.
- No afecta el modelo `User` (el enum de `rol` sigue siendo `user`/`admin`), ni el middleware `authorize`, ni el resto de capabilities (`csv-documents`, `frontend-auth-ui`, `csv-dashboard-ui`).
- Rompe compatibilidad hacia atrás del contrato del endpoint: cualquier cliente que hoy envíe `rol` en el registro será ignorado silenciosamente (el usuario creado siempre será `user`). No hay usuarios admin creados por este medio en producción que se vean afectados porque el proyecto está en fase de prueba técnica.

## 1. Backend: cerrar la autoasignación de rol

- [x] 1.1 En `backend/src/controllers/auth.controller.js`, función `register`: dejar de desestructurar `rol` de `req.body` y crear el usuario siempre con `User.create({ nombre, passwordHash, rol: 'user' })`.
- [x] 1.2 En `backend/src/routes/auth.routes.js`: eliminar la regla `body('rol').isIn(['user', 'admin'])...` del array de validaciones de `POST /register` (ya no hay campo `rol` que validar).
- [x] 1.3 Verificar manualmente (curl contra `docker compose up` real, o el workaround de payload en archivo si hay tildes): registrar un usuario enviando `{"nombre":"...", "contraseña":"...", "confirmarContraseña":"...", "rol":"admin"}` y confirmar en la respuesta/DB que el usuario quedó con `rol: 'user'`, no `admin`.

## 2. Seeder de administración

- [x] 2.1 Crear `backend/src/seeders/createAdmin.js`: script Node standalone que usa `../config/database` y el modelo `User`, lee `ADMIN_SEED_NOMBRE` y `ADMIN_SEED_PASSWORD` de variables de entorno, y:
  - Si faltan esas variables, imprime un mensaje de error explicando cómo usarlas y sale con `process.exit(1)`.
  - Si el usuario `nombre` ya existe, actualiza su `rol` a `admin` (no toca la contraseña existente).
  - Si no existe, lo crea con `passwordHash` (bcrypt, `SALT_ROUNDS = 10`, igual que en el controller) y `rol: 'admin'`.
  - Imprime un mensaje claro de éxito indicando `nombre` y que quedó como `admin`, y sale con `process.exit(0)`.
- [x] 2.2 En `backend/package.json`, agregar el script `"seed:admin": "node src/seeders/createAdmin.js"`.
- [x] 2.3 Verificar manualmente: con la stack levantada (`docker compose up`), correr `ADMIN_SEED_NOMBRE=admin_seed ADMIN_SEED_PASSWORD=algo-seguro docker compose exec backend npm run seed:admin` y confirmar que el usuario queda creado con `rol: 'admin'` (login posterior con esas credenciales debe devolver un JWT con `rol: 'admin'`). Repetir el comando una segunda vez y confirmar que actualiza en vez de fallar por duplicado.

## 3. Frontend: quitar el selector de rol

- [x] 3.1 En `frontend/src/views/RegisterView.vue`: eliminar `rol: 'user'` de `data()`, eliminar el bloque `<div class="field">` que contiene el `<select id="rol">`, y quitar `rol: this.rol` del payload de `api.post('/auth/register', ...)`. Quitar también el reset de `this.rol = 'user'` en el bloque de éxito.
- [x] 3.2 Verificar en el navegador (`docker compose up`, `http://localhost:5173/register`): el formulario ya no muestra el campo "Rol", y un registro normal sigue funcionando (crea el usuario, redirige/permite ir a login).

## 4. Documentación y specs

- [x] 4.1 Actualizar `openspec/config.yaml`: cambiar la línea de contexto "Registro: nombre, contraseña, confirmar contraseña, rol (user | admin)." para reflejar que el registro público ya no incluye `rol` y que `admin` se asigna vía DB/seeder.
- [x] 4.2 Si el repo tiene una sección de setup en `README.md` que menciona el registro con rol o no menciona cómo crear un admin, actualizarla para documentar el flujo del seeder (`npm run seed:admin` con las variables de entorno requeridas).

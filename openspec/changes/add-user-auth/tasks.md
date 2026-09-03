## 1. Modelo de datos

- [x] 1.1 Crear `backend/src/models/user.model.js` (Sequelize) con campos `nombre` (string, unique, not null), `passwordHash` (string, not null), `rol` (enum `user`/`admin`, not null) y verificar que el archivo exporta el modelo correctamente.
- [x] 1.2 Crear `backend/src/models/index.js` que inicialice todos los modelos sobre la instancia de `sequelize` (`backend/src/config/database.js`) y los exporte desde un único punto.

## 2. Registro y login

- [x] 2.1 Crear `backend/src/controllers/auth.controller.js` con `register` (valida body, verifica que `contraseña === confirmarContraseña`, hashea con bcryptjs, crea el usuario, responde 201 sin exponer `passwordHash`) y verificar manualmente con una petición que un registro válido devuelve 201 y uno con contraseñas distintas devuelve 400.
- [x] 2.2 Añadir `login` al controller: busca por `nombre`, compara hash con bcryptjs, firma JWT con `jsonwebtoken` (payload `id`, `nombre`, `rol`; expiración desde `JWT_EXPIRES_IN`) y responde 200 con el token; credenciales inválidas responden 401. Verificar con una petición que un login correcto devuelve un token y uno incorrecto devuelve 401.
- [x] 2.3 Crear `backend/src/routes/auth.routes.js` con `POST /register` y `POST /login`, usando `express-validator` para validar presencia/formato de los campos de entrada antes de llegar al controller.

## 3. Middlewares de seguridad

- [x] 3.1 Crear `backend/src/middlewares/auth.middleware.js` con `authenticate` (lee `Authorization: Bearer <token>`, verifica con `jsonwebtoken`, adjunta `req.user`, responde 401 si falta o es inválido) y verificar pegándole a una ruta protegida de prueba sin token (401) y con token válido (pasa).
- [x] 3.2 Añadir `authorize(rolesPermitidos)` al mismo archivo: responde 403 si `req.user.rol` no está en `rolesPermitidos`. Verificar con un usuario `user` contra una ruta restringida a `admin` (403) y con `admin` (pasa).
- [x] 3.3 Crear `backend/src/middlewares/error.middleware.js` que capture errores (validación, Sequelize, genéricos) y responda siempre `{ error: { message, details? } }` con el código HTTP adecuado.

## 4. Integración

- [x] 4.1 Modificar `backend/src/index.js`: importar `./models` para registrar los modelos, montar `app.use('/api/auth', authRoutes)`, agregar `sequelize.sync()` antes de levantar el servidor, y registrar `error.middleware.js` como último middleware. Verificar que `npm run dev` arranca sin errores y `/health` sigue respondiendo 200.
- [ ] 4.2 Verificación end-to-end: con la base de datos levantada (`docker compose up db` o Postgres accesible), probar manualmente el flujo completo: registro → login → llamada a un endpoint protegido de ejemplo con y sin token, confirmando los códigos de estado esperados (201/400/401/403/200). **PENDIENTE**: no hay Docker ni Postgres accesible en este entorno de ejecución (ver reporte del agente programador) — requiere que otro agente/entorno con `docker compose up db` disponible complete esta verificación.

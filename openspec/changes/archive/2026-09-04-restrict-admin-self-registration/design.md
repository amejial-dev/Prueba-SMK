## Context

El campo `rol` en `POST /api/auth/register` se dejó abierto desde el primer change (`add-user-auth`) únicamente para poder probar rápido los dos caminos de RBAC (`user` vs `admin`) sin tener que tocar la base de datos a mano durante el desarrollo. Ya no es necesario mantenerlo abierto: es un hueco de seguridad real (cualquiera puede autoasignarse `admin` y borrar documentos de otros).

## Goals / Non-Goals

**Goals**
- Cerrar la autoasignación de `admin` desde el endpoint público de registro.
- Dejar un camino explícito y documentado para crear el primer admin (o cualquier admin) sin tocar SQL a mano: un seeder de Node ejecutable con `npm run seed:admin`.

**Non-Goals**
- No se agrega un panel de administración de usuarios (fuera del alcance de la prueba técnica).
- No se cambia el modelo `User` ni el enum de `rol` (sigue siendo `user`/`admin`; solo cambia quién puede setearlo y cómo).
- No se agrega un endpoint autenticado de "promover a admin" — eso es un cambio futuro si se necesita, no parte de este fix.

## Decisions

### 1. El backend ignora `rol` en el body de registro, no lo valida como inválido
En vez de rechazar la petición con 400 si llega `rol`, el controlador simplemente no lo lee del `req.body` y siempre crea con `rol: 'user'`. Esto evita romper a un cliente que aún lo envíe (como el frontend actual, hasta que se actualice en este mismo change) y es más simple que agregar una regla de validación "rol no permitido".

`backend/src/controllers/auth.controller.js`, función `register`:
```js
async function register(req, res, next) {
  try {
    const { nombre, contraseña, confirmarContraseña } = req.body; // ya no se desestructura `rol`
    // ... misma lógica de validación de contraseñas y duplicado ...
    const user = await User.create({ nombre, passwordHash, rol: 'user' }); // fijo
    // ... misma respuesta 201 ...
  } catch (error) { return next(error); }
}
```

### 2. Se retira la regla de `express-validator` sobre `rol` en la ruta de registro
`backend/src/routes/auth.routes.js`: eliminar por completo la línea `body('rol').isIn(['user', 'admin'])...` del array de validaciones de `POST /register`. No hay nada que validar porque el campo ya no se usa.

### 3. Seeder de administración: script standalone, no un endpoint HTTP
`backend/src/seeders/createAdmin.js`: un script Node ejecutable directamente (`node src/seeders/createAdmin.js` o vía `npm run seed:admin`) que:
- Se conecta usando la misma configuración de Sequelize (`../config/database`).
- Lee `nombre` y `contraseña` desde variables de entorno (`ADMIN_SEED_NOMBRE`, `ADMIN_SEED_PASSWORD`) para no dejar credenciales hardcodeadas en el repo.
- Si el usuario ya existe: actualiza su `rol` a `admin` (permite "promover" un usuario existente).
- Si no existe: lo crea con la contraseña hasheada (mismo `bcrypt`, `SALT_ROUNDS = 10` que usa el controller) y `rol: 'admin'`.
- Imprime un mensaje claro de éxito/error y termina el proceso (`process.exit(0)` / `process.exit(1)`).

`backend/package.json`, agregar script:
```json
"seed:admin": "node src/seeders/createAdmin.js"
```

Uso típico (documentado en el README y en el mensaje del propio script si faltan variables):
```bash
ADMIN_SEED_NOMBRE=admin ADMIN_SEED_PASSWORD=algo-seguro docker compose exec backend npm run seed:admin
```

### 4. Frontend: se quita el `<select>` de rol, no se oculta
`frontend/src/views/RegisterView.vue`: se elimina el campo `rol` de `data()`, el `<div class="field">` con el `<select id="rol">`, y ya no se envía `rol` en el `api.post('/auth/register', ...)`. No se reemplaza por nada (no hay necesidad de un campo oculto ni de un valor por defecto en el payload — el backend ya lo fija).

## Risks / Trade-offs

- **Riesgo de quedar sin ningún admin en un ambiente nuevo**: mitigado por el seeder, que debe documentarse en el README como parte del setup inicial (`docker compose up` + correr el seeder una vez).
- **No hay autenticación en el seeder**: es intencional, corre a nivel de infraestructura (quien tiene acceso al contenedor/DB), igual que correr una migración. No se expone por HTTP.

## Migration Plan

1. Backend primero: controller + ruta (el frontend actual seguirá funcionando porque `rol` simplemente se ignora en tránsito).
2. Seeder + script de npm.
3. Frontend: quitar el selector.
4. Actualizar `openspec/specs/user-auth/spec.md` (vía archive) y `openspec/config.yaml` (la línea de contexto sobre el registro).
5. Verificación manual: registrar un usuario enviando `rol: "admin"` a propósito por curl y confirmar que en la base de datos queda con `rol: 'user'`; correr el seeder y confirmar que ese mismo usuario (o uno nuevo) queda con `rol: 'admin'`.

## Open Questions

Ninguna — alcance acotado y sin dependencias externas nuevas.

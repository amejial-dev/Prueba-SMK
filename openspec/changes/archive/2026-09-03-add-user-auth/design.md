## Context

Proyecto backend recién escafoldado (`backend/src/index.js` solo conecta Sequelize y expone `/health`). No existe ningún modelo todavía. Ver `proposal.md - Why` para la motivación.

## Goals / Non-Goals

**Goals:**
- Dejar auth funcionando de punta a punta (registro, login, protección de rutas por token y por rol) para que las siguientes capabilities (CSV, RBAC de eliminación) puedan apoyarse en `authenticate`/`authorize` sin reabrir esta capa.

**Non-Goals:**
- Recuperación de contraseña, verificación de correo, refresh tokens: fuera del alcance de la prueba.
- UI de login/registro (se cubre en el change de frontend).

## Decisions

- **Campo `nombre` como identificador de login** (no email): el enunciado pide `nombre` como campo de registro, no correo. Se agrega constraint `unique` en el modelo para evitar duplicados.
- **JWT stateless, sin tabla de sesiones**: el token lleva `id`, `nombre`, `rol` y expira por `JWT_EXPIRES_IN` (ya definido en `.env.example`). Alternativa descartada: sesiones en BD — añade complejidad innecesaria para el alcance de la prueba.
- **bcryptjs sobre bcrypt nativo**: evita depender de compilación nativa (node-gyp) dentro del contenedor Docker; ya está instalado.
- **Middlewares separados `authenticate` y `authorize(roles)`**: composición explícita por ruta (`router.delete('/x', authenticate, authorize(['admin']), handler)`) en vez de un único middleware con lógica condicional, para que cada ruta declare sus requisitos de forma legible.
- **Manejo de errores centralizado**: `error.middleware.js` como último middleware de Express, para que validaciones de `express-validator` y errores de Sequelize devuelvan siempre el mismo shape `{ error: { message, details? } }`.

## Risks / Trade-offs

- [Secreto JWT débil por defecto en `.env.example`] → Mitigación: `README.md` ya indica copiar y ajustar `.env`; se documenta en `tasks.md` no commitear `.env` real (ya cubierto por `.gitignore`).
- [Uso de `sequelize.sync()` en vez de migraciones] → Mitigación: aceptable para el alcance y tiempo de la prueba; se deja anotado como decisión consciente, no como deuda oculta.

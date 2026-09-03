## Context

El frontend es el scaffold default de `create-vue` (Vue 3, Option API, Vue Router ya instalado, sin CSS framework, sin Pinia). El backend expone `POST /api/auth/register` y `POST /api/auth/login` (ver `add-user-auth`), con JWT sin refresh. Ver `proposal.md - Why` para la motivación.

## Goals / Non-Goals

**Goals:**
- Fijar tokens visuales concretos para glassmorphism (no dejarlo a interpretación libre) para que login, registro y el futuro dashboard se vean como una sola app coherente.
- Dejar un cliente HTTP y manejo de sesión reutilizables para que el change del dashboard solo tenga que consumirlos.

**Non-Goals:**
- Librería de componentes de terceros (Vuetify, PrimeVue, etc.): se construyen 2-3 componentes propios mínimos (`GlassCard`, y estilos de botón/input vía clases CSS globales), no un design system completo.
- Pinia/Vuex: la sesión es un objeto reactivo simple exportado desde un módulo (`session.js`), suficiente para el tamaño de esta app.
- Dark/light mode conmutable: se elige una única estética (fondo oscuro con gradiente) fija.

## Decisions

- **Sin CSS framework, CSS plano con variables**: consistente con que el proyecto no tiene Tailwind/otra dependencia instalada; evita añadir peso y configuración solo para esta prueba.
- **Paleta y tokens fijos** en `frontend/src/styles/glass.css` (variables en `:root`):
  - Fondo de la app: `body` con gradiente fijo `background: linear-gradient(135deg, #0f0c29, #302b63, #24243e)` tamaño `400% 400%`, animado con `@keyframes gradientShift` moviendo `background-position` en un ciclo de ~15s (`ease-in-out infinite`) — esto es lo que da la sensación "dinámica" pedida, sin ser distractor.
  - `--glass-bg: rgba(255, 255, 255, 0.10)`, `--glass-border: rgba(255, 255, 255, 0.25)`, `--glass-blur: 16px`, `--glass-radius: 18px`, `--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.35)`.
  - Clase utilitaria `.glass` con `background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: var(--glass-radius); backdrop-filter: blur(var(--glass-blur)); -webkit-backdrop-filter: blur(var(--glass-blur)); box-shadow: var(--glass-shadow);`.
  - Componente `GlassCard.vue`: wrapper con un `<div class="glass">` y `<slot />`, prop opcional `padded` (boolean, default true) para controlar el padding interno. Todas las vistas (login, registro, y luego dashboard) se construyen dentro de un `GlassCard`.
  - Botones/inputs: clases globales `.btn-glass` y `.input-glass` en el mismo `glass.css`, con estados `:hover` (leve `transform: translateY(-1px)` y aumento de opacidad de fondo) y `:focus-visible` (outline visible para accesibilidad) — esto cubre la parte "dinámica" a nivel de microinteracciones sin animaciones exageradas.
  - Fuente: usar una font-stack de sistema (`-apple-system, "Segoe UI", Roboto, sans-serif`) — sin añadir Google Fonts para no depender de red externa.
- **`api.js` con Axios**: instancia única con `baseURL` desde `import.meta.env.VITE_API_URL` (con default `http://localhost:3000/api` si no está definida), interceptor de request que agrega `Authorization: Bearer <token>` si hay sesión, e interceptor de response que, ante un 401, limpia la sesión y redirige a `/login` (usando la instancia del router importada, o `window.location` si evitar el acoplamiento circular es más simple — decisión libre del agente programador siempre que el resultado sea el especificado).
- **`session.js` con un objeto reactivo (`Vue.reactive`)**: expone `{ token, user }`, funciones `setSession(token, user)` (guarda en `localStorage` y actualiza el reactive), `clearSession()` (borra `localStorage` y resetea) y `isAuthenticated`/`role` como getters computados a partir del estado; se inicializa leyendo `localStorage` al cargar el módulo para sobrevivir a un refresh de página.
- **Guard de rutas con `router.beforeEach`**: rutas marcadas con `meta: { requiresAuth: true }` (dashboard) redirigen a `/login` sin sesión; rutas marcadas `meta: { guestOnly: true }` (login, registro) redirigen a `/` (dashboard) con sesión activa.
- **Variable de entorno del frontend**: `frontend/.env.example` con `VITE_API_URL=http://localhost:3000/api`, consistente con el puerto ya expuesto en `docker-compose.yml` para el backend.

## Risks / Trade-offs

- [`backdrop-filter` no soportado en navegadores muy antiguos] → Mitigación: fuera de alcance (prueba técnica evaluada en navegadores modernos); no se añade fallback especial.
- [Sesión en `localStorage` es vulnerable a XSS comparado con cookie httpOnly] → Mitigación: aceptado conscientemente para el alcance de la prueba (el backend tampoco emite cookies); anotado aquí en vez de dejarlo como decisión implícita.

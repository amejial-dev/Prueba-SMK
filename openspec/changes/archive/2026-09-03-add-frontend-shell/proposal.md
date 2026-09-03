## Why

El frontend actual es el scaffold por defecto de `create-vue` (HelloWorld, About) sin sistema de diseño ni forma de hablar con el backend. Antes de construir el dashboard (change aparte) hace falta: un cliente HTTP con manejo de token, las vistas de acceso (Login/Registro), y el lenguaje visual glassmorphism que el enunciado exige para toda la app.

## What Changes

- Sistema de diseño glassmorphism reutilizable: variables CSS (fondos translúcidos, `backdrop-filter: blur`, bordes semi-transparentes, sombras suaves, gradiente de fondo animado/dinámico) aplicado como base global, más componentes de UI reutilizables (tarjeta de vidrio, botón, input) con ese estilo.
- Cliente Axios centralizado (`src/services/api.js`) que apunta a la URL del backend (vía variable de entorno de Vite), adjunta el JWT guardado en cada request, y redirige a `/login` si el backend responde 401.
- Store simple de sesión (composable u objeto reactivo, sin Vuex/Pinia) que guarda `token` y datos del usuario en `localStorage` y expone si hay sesión activa y el rol del usuario.
- Vista `LoginView`: formulario de usuario/contraseña, llama a `POST /api/auth/login`, guarda el token, redirige al dashboard; muestra error si las credenciales son inválidas.
- Vista `RegisterView`: formulario con nombre, contraseña, confirmar contraseña y selección de rol (user/admin); valida en el cliente que las contraseñas coincidan antes de enviar; llama a `POST /api/auth/register`; muestra error del backend si falla.
- Guard de rutas en Vue Router: la ruta del dashboard requiere sesión activa (si no hay token, redirige a `/login`); las rutas de login/registro redirigen al dashboard si ya hay sesión.
- Reemplazo del scaffold por defecto (HelloWorld, About, iconos de ejemplo) por esta estructura real.

## Capabilities

### New Capabilities
- `frontend-auth-ui`: vistas de login/registro, manejo de sesión en el cliente, y guard de rutas basado en autenticación.

### Modified Capabilities
(ninguna — es la primera capability del frontend; consume la API de `user-auth` sin modificar su contrato)

## Impact

- Archivos nuevos: `frontend/src/services/api.js`, `frontend/src/services/session.js`, `frontend/src/views/LoginView.vue`, `frontend/src/views/RegisterView.vue`, `frontend/src/styles/glass.css` (o `.scss`), `frontend/src/components/GlassCard.vue`, `frontend/.env.example` (URL del backend para Vite).
- Archivos modificados: `frontend/src/router/index.js` (nuevas rutas + guard), `frontend/src/App.vue` (fondo glassmorphism global, quitar layout de ejemplo), `frontend/src/main.js` (importar el CSS global).
- Archivos eliminados: `frontend/src/components/HelloWorld.vue`, `TheWelcome.vue`, `WelcomeItem.vue`, `icons/*`, `frontend/src/views/HomeView.vue`, `AboutView.vue` (contenido de ejemplo de create-vue, sin uso en esta app).
- Depende de que `add-user-auth` (backend) exista y responda como está especificado; no depende de `add-csv-documents`.

## 1. Limpieza del scaffold

- [x] 1.1 Eliminar los archivos de ejemplo de `create-vue`: `frontend/src/components/HelloWorld.vue`, `TheWelcome.vue`, `WelcomeItem.vue`, `frontend/src/components/icons/` completo, `frontend/src/views/HomeView.vue`, `frontend/src/views/AboutView.vue`, y limpiar sus referencias en `frontend/src/router/index.js` y `frontend/src/App.vue`. Verificar que `npm run dev` sigue arrancando sin errores tras la limpieza.

## 2. Sistema de diseño glassmorphism

- [x] 2.1 Crear `frontend/src/styles/glass.css` con las variables, la clase `.glass`, el fondo animado (`body` + `@keyframes gradientShift`) y las clases `.btn-glass`/`.input-glass`, tal como se describe en `design.md`. Importarlo globalmente desde `frontend/src/main.js`. Verificar visualmente con `npm run dev` que el fondo con gradiente animado se ve y que una `<div class="glass">` de prueba se renderiza con el efecto de vidrio.
- [x] 2.2 Crear `frontend/src/components/GlassCard.vue` (Option API) como wrapper reutilizable con `<slot />` y prop `padded` (Boolean, default true). Verificar usándolo en al menos una vista.

## 3. Cliente HTTP y sesión

- [x] 3.1 Crear `frontend/.env.example` con `VITE_API_URL=http://localhost:3000/api`.
- [x] 3.2 Crear `frontend/src/services/session.js`: estado reactivo `{ token, user }` inicializado desde `localStorage`, funciones `setSession(token, user)`, `clearSession()`, y getters `isAuthenticated()`/`getRole()`. Verificar con un script o prueba manual en consola del navegador que `setSession` persiste en `localStorage` y `clearSession` lo limpia.
- [x] 3.3 Crear `frontend/src/services/api.js`: instancia de Axios con `baseURL` desde `import.meta.env.VITE_API_URL`, interceptor de request que agrega el header `Authorization` si hay token en `session.js`, e interceptor de response que ante un 401 llama a `clearSession()` y redirige a `/login`. Verificar que el archivo se importa sin errores y que la instancia expone `get/post/delete` (Axios estándar).

## 4. Vistas de acceso

- [x] 4.1 Crear `frontend/src/views/LoginView.vue` (Option API): formulario con usuario y contraseña dentro de un `GlassCard`, botón con clase `.btn-glass`, inputs con `.input-glass`; al enviar, llama a `api.post('/auth/login', ...)`, en éxito guarda la sesión con `setSession` y navega a `/`; en error muestra el mensaje de la respuesta del backend en la propia vista (sin `alert()` bloqueante). Verificar manualmente el layout con `npm run dev` (aunque el backend no esté disponible, confirmar que el formulario renderiza y que un envío sin backend cae en el bloque de error sin romper la vista).
- [x] 4.2 Crear `frontend/src/views/RegisterView.vue` (Option API): formulario con nombre, contraseña, confirmar contraseña y selección de rol (`user`/`admin`) dentro de un `GlassCard`; valida en el propio componente que contraseña y confirmación coincidan antes de llamar al backend, mostrando el error sin hacer la petición si no coinciden; al enviar y tener éxito, muestra confirmación y ofrece ir a login; en error del backend, muestra el mensaje recibido. Verificar manualmente que la validación de contraseñas distintas bloquea el envío antes de tocar la red.

## 5. Router y layout

- [x] 5.1 Actualizar `frontend/src/router/index.js`: rutas `/login` (`LoginView`, `meta: { guestOnly: true }`), `/register` (`RegisterView`, `meta: { guestOnly: true }`), y una ruta raíz `/` marcada `meta: { requiresAuth: true }` apuntando a un componente placeholder de dashboard (puede ser un `DashboardView.vue` mínimo con un `GlassCard` de bienvenida, ya que el dashboard real es otro change). Añadir `router.beforeEach` que aplique el guard descrito en `design.md` usando `session.js`. Verificar navegando manualmente: sin sesión, `/` redirige a `/login`; con sesión simulada (`setSession` manual), `/login` redirige a `/`.
- [x] 5.2 Actualizar `frontend/src/App.vue` para quitar el layout de ejemplo de `create-vue` y dejar solo `<RouterView />` sobre el fondo global de `glass.css`. Verificar que `npm run dev` muestra login por defecto (sin sesión) con el fondo glassmorphism aplicado.

## 6. Verificación final

- [ ] 6.1 Con el backend corriendo (`npm run dev` en `backend/`, requiere Postgres accesible), probar el flujo completo en el navegador: registro → redirección/aviso → login → redirección a `/` → recargar la página y confirmar que la sesión persiste. Si no hay Postgres/backend accesible en este entorno, dejar la tarea sin marcar y anotarlo explícitamente, dejando documentado qué se verificó solo a nivel de UI (sin red) en las tareas anteriores.

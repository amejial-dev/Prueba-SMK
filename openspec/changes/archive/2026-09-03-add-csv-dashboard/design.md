## Context

`DashboardView.vue` es hoy un placeholder (de `add-frontend-shell`) que solo muestra el nombre/rol del usuario y un botón de cerrar sesión — eso se conserva. El backend de `add-csv-documents` ya está implementado con el siguiente contrato real (fuente: `backend/src/routes/document.routes.js` y `backend/src/controllers/document.controller.js` — no lo reinterpretes, es exacto):

- `POST /api/documents` — requiere `Authorization: Bearer <token>` (ya lo agrega `api.js` automáticamente). Cuerpo `multipart/form-data` con el archivo en el campo **`file`** (ese nombre exacto, no `csv` ni `archivo`). Respuesta 201: `{ id, nombreOriginal, numeroRegistros, usuarioId, createdAt }`. Respuesta 400 por filas inválidas: `{ error: { message, details: [{ fila, campo, mensaje }] } }`.
- `GET /api/documents` — requiere auth. Respuesta 200: array de `{ id, nombreOriginal, usuario: { id, nombre } | null, fechaCarga, numeroRegistros }`.
- `GET /api/documents/:id/download` — requiere auth. Responde el archivo binario para descarga (no JSON).
- `DELETE /api/documents/:id` — requiere auth + rol `admin`. Respuesta 200: `{ message }`. Respuesta 403 si el rol no es `admin`, 404 si no existe.

**Lección de un change anterior**: en `add-frontend-shell` el frontend envió campos en inglés (`password`) mientras el backend esperaba español (`contraseña`) y hubo que corregirlo en revisión. Aquí el contrato ya está fijado arriba con los nombres EXACTOS — úsalos literalmente, no los traduzcas ni adivines.

Ver `proposal.md - Why` para la motivación completa.

## Goals / Non-Goals

**Goals:**
- Que la carga y el listado funcionen contra el contrato real del backend sin ajustes posteriores.
- Reutilizar `api.js` (ya adjunta el JWT y maneja el 401 global) y el sistema `.glass`/`GlassCard` sin duplicar estilos.

**Non-Goals:**
- Paginación de la tabla de documentos: fuera de alcance, se lista todo lo que devuelva `GET /api/documents`.
- Previsualización del contenido del CSV antes de subir: no lo pide el enunciado.

## Decisions

- **`CsvUploader.vue`**: maneja tanto `dragover`/`drop` como un `<input type="file" accept=".csv">` oculto activado por click, para cubrir ambas formas mencionadas en el enunciado ("Drag & Drop o selector de archivos"). Emite un evento `uploaded` al componente padre (`DashboardView.vue`) cuando la carga fue exitosa, para que este dispare el refresco de la tabla. Construye el `FormData` con `formData.append('file', archivo)` (nombre de campo exacto del contrato).
- **`DocumentsTable.vue`**: recibe la lista de documentos y el rol del usuario actual como props; emite eventos `download(documentId)` y `delete(documentId)` hacia el padre en vez de llamar a `api` directamente, para mantener la responsabilidad de red centralizada en `DashboardView.vue`. Muestra el botón "Eliminar" con `v-if="role === 'admin'"`.
- **Descarga binaria con Axios**: `api.get('/documents/:id/download', { responseType: 'blob' })`, luego crear un `<a>` temporal con `URL.createObjectURL(blob)` y `download="<nombreOriginal>"` para forzar la descarga en el navegador (patrón estándar para descargas autenticadas vía Axios, ya que un `<a href>` directo no llevaría el header `Authorization`).
- **Estado en `DashboardView.vue`**: `documentos` (array, desde `GET /api/documents` al montar y tras cada carga/eliminación exitosa), `errorCarga` (para mostrar los `details` de una carga fallida), sin librería de estado adicional — consistente con `add-frontend-shell` (sin Pinia/Vuex).
- **Presentación de errores de validación de fila**: lista simple `fila N: campo — mensaje` dentro de un bloque con `class="error-message"` (ya existe ese estilo en `glass.css` vía las vistas de login/registro), no un `alert()`.

## Risks / Trade-offs

- [`DELETE` sin confirmación previa podría borrar por error] → Mitigación: fuera de alcance del enunciado (no pide modal de confirmación); aceptado conscientemente, se puede añadir después si se pide.
- [Tabla sin paginación puede volverse larga] → Mitigación: aceptado como Non-Goal explícito para el alcance de la prueba.

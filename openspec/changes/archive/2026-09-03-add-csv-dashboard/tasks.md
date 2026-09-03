## 1. Carga de archivos

- [x] 1.1 Crear `frontend/src/components/CsvUploader.vue` (Option API): zona `.glass` con soporte drag&drop (`@dragover.prevent`, `@drop.prevent`) y un `<input type="file" accept=".csv">` alternativo activado por click; al recibir un archivo, arma un `FormData` con `formData.append('file', archivo)` (nombre de campo exacto, ver design.md) y hace `api.post('/documents', formData)`; emite `@uploaded` en éxito y `@upload-error(detalle)` en fallo (usando `err.response.data.error` tal como lo devuelve el backend). Verificar con `npm run dev` que el drag&drop y el selector de archivo activan el mismo flujo (puede probarse sin backend confirmando que se dispara la petición y se maneja el error de red como fallo).

## 2. Tabla de documentos

- [x] 2.1 Crear `frontend/src/components/DocumentsTable.vue` (Option API): recibe `documentos` (Array) y `role` (String) como props; renderiza una tabla `.glass` con columnas nombre, usuario, fecha de carga, número de registros y acciones; botón "Descargar" siempre visible, botón "Eliminar" solo si `role === 'admin'`; emite `@download(id)` y `@delete(id)`. Si `documentos` está vacío, muestra un estado vacío en lugar de una tabla sin filas. Verificar renderizando el componente con datos de prueba (mock) para `role: 'user'` (sin botón eliminar) y `role: 'admin'` (con botón eliminar).

## 3. Vista principal

- [x] 3.1 Reescribir `frontend/src/views/DashboardView.vue`: conserva el header con nombre/rol de `session` y el botón de cerrar sesión ya existentes; agrega `CsvUploader` y `DocumentsTable` dentro de `GlassCard`(s); en `mounted()` (o equivalente) llama a `api.get('/documents')` y guarda el resultado en `documentos`; escucha `@uploaded` de `CsvUploader` para volver a pedir el listado; escucha `@upload-error` para mostrar el detalle de errores de validación (fila/campo/mensaje) sin `alert()` bloqueante. Verificar con `npm run dev` que la vista renderiza sin errores con `documentos: []` inicial.
- [x] 3.2 Implementar en `DashboardView.vue` el manejo de `@download(id)`: `api.get('/documents/'+id+'/download', { responseType: 'blob' })`, crear un enlace temporal con `URL.createObjectURL` y el `nombreOriginal` del documento correspondiente como nombre de descarga, y limpiar el objeto URL después. Verificar revisando el código que usa el `nombreOriginal` correcto tomado de la lista ya cargada (no pedir un dato aparte).
- [x] 3.3 Implementar en `DashboardView.vue` el manejo de `@delete(id)`: `api.delete('/documents/'+id)`, y al completarse quitar el documento de `documentos` (o volver a pedir el listado). Verificar revisando que el botón de eliminar en `DocumentsTable` para un usuario con rol `user` nunca se renderiza (ver tarea 2.1), como capa adicional de RBAC visual sobre la que ya impone el backend con `authorize(['admin'])`.

## 4. Verificación final

- [x] 4.1 Verificado en el navegador real (Chrome vía claude-in-chrome) contra `docker compose up`: login como admin → subir CSV válido → aparece en la tabla con nombre/usuario/fecha/registros correctos → subir CSV inválido → error detallado por fila sin tocar la tabla → descargar (archivo real guardado en Downloads) → eliminar → desaparece de la tabla. Logout y login como `user_test` → subir CSV → tabla muestra únicamente el botón "Descargar", sin "Eliminar" (RBAC visual confirmado).

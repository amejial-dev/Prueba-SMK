## Why

El backend de documentos (`add-csv-documents`) y el frontend con sesión/auth (`add-frontend-shell`) ya existen por separado, pero `DashboardView.vue` sigue siendo un placeholder de bienvenida. Falta la vista real que cumple el propósito de la prueba: subir CSV y ver/gestionar lo cargado.

## What Changes

- `DashboardView.vue` deja de ser un placeholder y se convierte en la vista funcional: zona de carga (drag & drop o selector de archivo) + tabla de documentos cargados.
- Componente de carga: acepta un archivo `.csv` por drag&drop o click, lo envía a `POST /api/documents`, muestra estado de carga, y en error de validación muestra el detalle fila-por-fila que devuelve el backend (no un `alert()` bloqueante, salvo que se use como notificación no bloqueante).
- Componente/tabla de documentos: consume `GET /api/documents` y muestra por cada fila: nombre del documento, usuario que lo cargó, fecha de carga, número de registros.
- Acción "Descargar": dispara la descarga de `GET /api/documents/:id/download`.
- Acción "Eliminar": visible/habilitada solo si el usuario en sesión tiene rol `admin`; llama a `DELETE /api/documents/:id` y refresca la tabla al completarse.
- Tras una carga exitosa, la tabla se refresca automáticamente para mostrar el nuevo documento sin recargar la página.
- Header simple con el nombre/rol del usuario en sesión y el botón de cerrar sesión (ya existente en el placeholder, se conserva).

## Capabilities

### New Capabilities
- `csv-dashboard-ui`: carga de CSV desde el frontend, listado en tabla, descarga y eliminación con RBAC visual.

### Modified Capabilities
(ninguna — consume `csv-documents` y `frontend-auth-ui` sin cambiar sus contratos)

## Impact

- Archivos modificados: `frontend/src/views/DashboardView.vue` (reemplaza el placeholder por la vista funcional).
- Archivos nuevos: `frontend/src/components/CsvUploader.vue`, `frontend/src/components/DocumentsTable.vue`.
- Depende de que el backend `add-csv-documents` esté implementado tal cual quedó (endpoints y shapes de respuesta ya fijos, no se modifican).
- Reutiliza `api.js`, `session.js`, `GlassCard.vue` y las clases `.glass`/`.btn-glass`/`.input-glass` de `add-frontend-shell` sin modificarlos.

## MODIFIED Requirements

### Requirement: Listado de documentos cargados
El sistema SHALL permitir a cualquier usuario autenticado consultar el listado de documentos cargados, incluyendo para cada uno: nombre del documento, usuario que lo cargó, fecha de carga y número de registros que contiene. El listado SHALL excluir los documentos eliminados lógicamente (ver Requirement "Eliminación restringida a administradores").

#### Scenario: Listado exitoso
- **WHEN** un usuario autenticado solicita el listado de documentos
- **THEN** el sistema responde con todos los documentos cargados y no eliminados, mostrando nombre, usuario, fecha de carga y número de registros de cada uno

#### Scenario: Documentos eliminados no aparecen en el listado
- **WHEN** existe un documento previamente eliminado (borrado lógico) y un usuario autenticado solicita el listado de documentos
- **THEN** el sistema no incluye ese documento en la respuesta

### Requirement: Eliminación restringida a administradores
El sistema SHALL permitir eliminar un documento cargado únicamente a usuarios con rol `admin`. Una solicitud de eliminación de un usuario con rol `user` SHALL ser rechazada sin eliminar nada. La eliminación SHALL ser lógica (borrado suave): el sistema SHALL marcar el documento como eliminado sin borrar su fila de la base de datos, sin borrar sus filas de datos asociadas (`DocumentRow`), y sin borrar el archivo físico del CSV original en disco. Un documento eliminado lógicamente SHALL comportarse como inexistente para el listado y para operaciones posteriores de descarga o eliminación (responder 404), pero su archivo físico y sus filas SHALL permanecer recuperables por acceso directo a la base de datos/disco.

#### Scenario: Eliminación por admin
- **WHEN** un usuario autenticado con rol `admin` solicita eliminar un documento existente
- **THEN** el sistema marca el documento como eliminado (borrado lógico), responde con éxito, conserva el archivo físico del CSV en disco y conserva las filas (`DocumentRow`) asociadas en la base de datos

#### Scenario: Documento eliminado deja de ser accesible por las rutas normales
- **WHEN** se solicita descargar o volver a eliminar un documento que ya fue eliminado lógicamente
- **THEN** el sistema responde con un error 404, igual que si el documento nunca hubiera existido

#### Scenario: Intento de eliminación por usuario sin permisos
- **WHEN** un usuario autenticado con rol `user` solicita eliminar un documento
- **THEN** el sistema responde con un error 403 y no elimina el documento

### Requirement: Carga de CSV con validación
El sistema SHALL permitir a cualquier usuario autenticado subir un archivo CSV con las columnas `correo`, `nombre`, `telefono`, `ciudad` y `notas` (opcional). El sistema SHALL validar cada fila: `correo` debe tener formato de email válido, `nombre` debe ser texto no vacío, `telefono` debe ser numérico, `ciudad` debe ser texto no vacío. Si alguna fila no cumple estas reglas, el sistema SHALL rechazar la carga completa sin persistir ningún dato y SHALL retornar el detalle de cada error (fila y motivo). El sistema SHALL rechazar archivos que excedan un tamaño máximo configurable, informando el motivo del rechazo. El sistema SHALL sanear el nombre del archivo antes de guardarlo en disco, de forma que no pueda alterar la ruta de destino ni introducir caracteres peligrosos del sistema de archivos.

#### Scenario: Carga válida
- **WHEN** un usuario autenticado sube un CSV donde todas las filas cumplen el formato esperado
- **THEN** el sistema persiste el documento y todas sus filas, y responde con éxito indicando el número de registros procesados

#### Scenario: Fila con teléfono no numérico
- **WHEN** el CSV contiene una fila cuyo campo `telefono` no es numérico
- **THEN** el sistema rechaza la carga completa, no persiste ninguna fila del archivo, y responde con un error que identifica la fila y el campo inválido

#### Scenario: Fila con correo inválido
- **WHEN** el CSV contiene una fila cuyo campo `correo` no tiene formato de email válido
- **THEN** el sistema rechaza la carga completa y responde con un error que identifica la fila y el campo inválido

#### Scenario: Carga sin autenticación
- **WHEN** se intenta subir un CSV sin un token válido
- **THEN** el sistema rechaza la petición con un error 401 y no procesa el archivo

#### Scenario: Archivo que excede el tamaño máximo permitido
- **WHEN** un usuario autenticado intenta subir un archivo que excede el tamaño máximo configurado
- **THEN** el sistema rechaza la carga con un error 400 que indica que se superó el tamaño máximo permitido, y no guarda el archivo en disco

#### Scenario: Nombre de archivo con caracteres peligrosos
- **WHEN** un usuario autenticado sube un CSV cuyo nombre original contiene segmentos de ruta (por ejemplo `../../etc/passwd`) o caracteres no seguros para el sistema de archivos
- **THEN** el sistema guarda el archivo en el directorio de subidas configurado usando un nombre saneado, sin que el nombre original pueda alterar la ubicación de destino en disco

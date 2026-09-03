## Purpose

Da a la persona usuaria el punto real de trabajo de la herramienta: subir un CSV de contactos y ver, descargar o (si es admin) eliminar lo que se ha cargado, sin salir de una sola pantalla.

## ADDED Requirements

### Requirement: Carga de CSV desde el dashboard
El sistema SHALL ofrecer una zona de carga de archivos (arrastrar y soltar, o selección manual) en la vista principal. Al enviarse un archivo, el sistema SHALL mostrar un estado de carga en curso, y al finalizar SHALL indicar éxito o mostrar el detalle de los errores de validación devueltos por el backend, sin recargar la página.

#### Scenario: Carga exitosa
- **WHEN** la persona usuaria arrastra o selecciona un CSV válido
- **THEN** el sistema lo envía al backend, muestra una confirmación, y el nuevo documento aparece en la tabla sin que la persona tenga que recargar la página

#### Scenario: Carga con filas inválidas
- **WHEN** el backend rechaza el CSV por contener filas inválidas
- **THEN** el sistema muestra el detalle de los errores (fila y motivo) devuelto por el backend, de forma legible, y no agrega ningún documento a la tabla

### Requirement: Listado de documentos en tabla
El sistema SHALL mostrar en una tabla todos los documentos cargados, con nombre del documento, usuario que lo cargó, fecha de carga y número de registros, obtenidos del backend.

#### Scenario: Tabla poblada
- **WHEN** existen documentos cargados
- **THEN** la tabla los muestra a todos con nombre, usuario, fecha de carga y número de registros

#### Scenario: Sin documentos cargados
- **WHEN** no existe ningún documento cargado todavía
- **THEN** la tabla muestra un estado vacío claro en lugar de una tabla en blanco o un error

### Requirement: Descarga del documento original
El sistema SHALL ofrecer, para cada documento de la tabla, una acción para descargar el archivo CSV original.

#### Scenario: Descarga desde la tabla
- **WHEN** la persona usuaria activa la acción de descargar sobre un documento
- **THEN** el sistema inicia la descarga del archivo CSV original de ese documento

### Requirement: Eliminación visible solo para administradores
El sistema SHALL mostrar la acción de eliminar un documento únicamente si la persona en sesión tiene rol `admin`; para cualquier otro rol, esa acción SHALL estar oculta o deshabilitada. Al eliminar, el sistema SHALL actualizar la tabla para reflejar que el documento ya no existe.

#### Scenario: Admin elimina un documento
- **WHEN** una persona con rol `admin` activa la acción de eliminar sobre un documento
- **THEN** el sistema lo elimina en el backend y lo quita de la tabla

#### Scenario: Usuario sin permisos no ve la acción de eliminar
- **WHEN** una persona con rol `user` ve la tabla de documentos
- **THEN** la acción de eliminar no está visible o está deshabilitada para esa persona

## MODIFIED Requirements

### Requirement: Listado de documentos en tabla
El sistema SHALL mostrar en una tabla todos los documentos cargados y no eliminados, con nombre del documento, usuario que lo cargó, fecha de carga y número de registros, obtenidos del backend. Un documento eliminado (borrado lógico) SHALL dejar de aparecer en la tabla inmediatamente después de eliminarse.

#### Scenario: Tabla poblada
- **WHEN** existen documentos cargados y no eliminados
- **THEN** la tabla los muestra a todos con nombre, usuario, fecha de carga y número de registros

#### Scenario: Sin documentos cargados
- **WHEN** no existe ningún documento cargado todavía, o todos los existentes fueron eliminados
- **THEN** la tabla muestra un estado vacío claro en lugar de una tabla en blanco o un error

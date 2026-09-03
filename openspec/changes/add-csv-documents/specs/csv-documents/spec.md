## Purpose

Permite a los usuarios autenticados subir listados de contactos en CSV, garantiza que solo se persistan datos válidos, y da visibilidad y control (listar, descargar, eliminar) sobre lo cargado, respetando quién puede eliminar.

## ADDED Requirements

### Requirement: Carga de CSV con validación
El sistema SHALL permitir a cualquier usuario autenticado subir un archivo CSV con las columnas `correo`, `nombre`, `telefono`, `ciudad` y `notas` (opcional). El sistema SHALL validar cada fila: `correo` debe tener formato de email válido, `nombre` debe ser texto no vacío, `telefono` debe ser numérico, `ciudad` debe ser texto no vacío. Si alguna fila no cumple estas reglas, el sistema SHALL rechazar la carga completa sin persistir ningún dato y SHALL retornar el detalle de cada error (fila y motivo).

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

### Requirement: Listado de documentos cargados
El sistema SHALL permitir a cualquier usuario autenticado consultar el listado de documentos cargados, incluyendo para cada uno: nombre del documento, usuario que lo cargó, fecha de carga y número de registros que contiene.

#### Scenario: Listado exitoso
- **WHEN** un usuario autenticado solicita el listado de documentos
- **THEN** el sistema responde con todos los documentos cargados, mostrando nombre, usuario, fecha de carga y número de registros de cada uno

### Requirement: Descarga del documento original
El sistema SHALL permitir a cualquier usuario autenticado descargar el archivo CSV original de un documento previamente cargado.

#### Scenario: Descarga exitosa
- **WHEN** un usuario autenticado solicita descargar un documento existente
- **THEN** el sistema retorna el archivo CSV original tal como fue cargado

#### Scenario: Documento inexistente
- **WHEN** se solicita descargar un documento que no existe
- **THEN** el sistema responde con un error 404

### Requirement: Eliminación restringida a administradores
El sistema SHALL permitir eliminar un documento cargado (y sus filas asociadas) únicamente a usuarios con rol `admin`. Una solicitud de eliminación de un usuario con rol `user` SHALL ser rechazada sin eliminar nada.

#### Scenario: Eliminación por admin
- **WHEN** un usuario autenticado con rol `admin` solicita eliminar un documento existente
- **THEN** el sistema elimina el documento y sus filas asociadas, y responde con éxito

#### Scenario: Intento de eliminación por usuario sin permisos
- **WHEN** un usuario autenticado con rol `user` solicita eliminar un documento
- **THEN** el sistema responde con un error 403 y no elimina el documento

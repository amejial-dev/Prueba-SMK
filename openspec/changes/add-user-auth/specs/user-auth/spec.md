## Purpose

Identifica quién usa el sistema y con qué rol, para que el resto de capacidades (carga de CSV, eliminación de registros) puedan exigir sesión y permisos.

## ADDED Requirements

### Requirement: Registro de usuario
El sistema SHALL permitir crear una cuenta enviando `nombre`, `contraseña`, `confirmar contraseña` y `rol`. El registro SHALL rechazarse si `contraseña` y `confirmar contraseña` no coinciden, si `rol` no es `user` ni `admin`, o si `nombre` ya está registrado. La contraseña SHALL almacenarse únicamente como hash, nunca en texto plano.

#### Scenario: Registro exitoso
- **WHEN** se envían `nombre`, `contraseña`, `confirmar contraseña` (igual a `contraseña`) y `rol` válido (`user` o `admin`)
- **THEN** el sistema crea el usuario y responde con éxito sin exponer la contraseña ni su hash

#### Scenario: Contraseñas no coinciden
- **WHEN** `contraseña` y `confirmar contraseña` son distintos
- **THEN** el sistema responde con un error 400 detallando el campo inválido y no crea el usuario

#### Scenario: Nombre de usuario duplicado
- **WHEN** se registra un `nombre` que ya existe en el sistema
- **THEN** el sistema responde con un error 400 (o 409) indicando que el usuario ya existe

### Requirement: Autenticación con JWT
El sistema SHALL permitir iniciar sesión con `nombre` y `contraseña`, y SHALL retornar un token JWT firmado cuando las credenciales son válidas. El token SHALL incluir el id, nombre y rol del usuario, y SHALL expirar tras un tiempo configurable.

#### Scenario: Login exitoso
- **WHEN** se envían `nombre` y `contraseña` correctos de un usuario existente
- **THEN** el sistema responde con un token JWT válido y los datos públicos del usuario (sin la contraseña)

#### Scenario: Credenciales inválidas
- **WHEN** el `nombre` no existe o la `contraseña` no coincide con el hash almacenado
- **THEN** el sistema responde con un error 401 sin indicar cuál de los dos datos fue incorrecto

### Requirement: Protección de rutas autenticadas
El sistema SHALL exponer un mecanismo para exigir un JWT válido en el header `Authorization: Bearer <token>` en cualquier endpoint que lo requiera. Una petición sin token o con un token inválido/expirado SHALL ser rechazada antes de ejecutar la lógica de negocio del endpoint.

#### Scenario: Acceso sin token
- **WHEN** se solicita un endpoint protegido sin header `Authorization`
- **THEN** el sistema responde con un error 401 y no ejecuta la lógica del endpoint

#### Scenario: Token inválido o expirado
- **WHEN** se solicita un endpoint protegido con un token corrupto, mal firmado o expirado
- **THEN** el sistema responde con un error 401 y no ejecuta la lógica del endpoint

### Requirement: Control de acceso por rol
El sistema SHALL exponer un mecanismo para restringir un endpoint a uno o más roles específicos. Una petición de un usuario autenticado cuyo rol no está permitido para ese endpoint SHALL ser rechazada.

#### Scenario: Rol no autorizado
- **WHEN** un usuario autenticado con rol `user` solicita un endpoint restringido a `admin`
- **THEN** el sistema responde con un error 403 y no ejecuta la lógica del endpoint

#### Scenario: Rol autorizado
- **WHEN** un usuario autenticado con rol `admin` solicita un endpoint restringido a `admin`
- **THEN** el sistema ejecuta la lógica del endpoint normalmente

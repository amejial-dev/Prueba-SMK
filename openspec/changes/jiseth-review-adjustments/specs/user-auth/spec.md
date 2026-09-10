## MODIFIED Requirements

### Requirement: Registro de usuario
El sistema SHALL permitir crear una cuenta enviando `nombre`, `contraseña` y `confirmar contraseña`. El registro SHALL rechazarse si `contraseña` y `confirmar contraseña` no coinciden, o si `nombre` ya está registrado. La contraseña SHALL almacenarse únicamente como hash, nunca en texto plano. Todo usuario creado por este endpoint SHALL recibir el rol `user`. El sistema PUEDE aceptar un campo `rol` opcional en la petición, pero únicamente con el valor `user`; cualquier otro valor (incluido `admin`) SHALL ser rechazado con un error 400 explícito, sin crear el usuario. El rol `admin` SHALL asignarse únicamente mediante acceso directo a la base de datos o mediante un seeder de administración ejecutado por quien opera el sistema, nunca a través de este endpoint público.

#### Scenario: Registro exitoso
- **WHEN** se envían `nombre`, `contraseña` y `confirmar contraseña` (igual a `contraseña`), con o sin `rol: 'user'`
- **THEN** el sistema crea el usuario con rol `user` y responde con éxito sin exponer la contraseña ni su hash

#### Scenario: Contraseñas no coinciden
- **WHEN** `contraseña` y `confirmar contraseña` son distintos
- **THEN** el sistema responde con un error 400 detallando el campo inválido y no crea el usuario

#### Scenario: Nombre de usuario duplicado
- **WHEN** se registra un `nombre` que ya existe en el sistema
- **THEN** el sistema responde con un error 400 (o 409) indicando que el usuario ya existe

#### Scenario: Intento de autoasignar rol admin
- **WHEN** se envía un campo `rol` con un valor distinto de `user` (incluido `admin`) en la petición de registro
- **THEN** el sistema rechaza la petición con un error 400 indicando que ese rol no está permitido en el registro público, y no crea el usuario

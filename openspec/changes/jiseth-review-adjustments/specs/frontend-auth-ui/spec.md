## MODIFIED Requirements

### Requirement: Registro desde el frontend
El sistema SHALL ofrecer un formulario de registro con los campos nombre, contraseña, confirmar contraseña y un selector de rol. El selector de rol SHALL mostrar la opción "Usuario" como seleccionable y la opción "Administrador" visible pero deshabilitada (no seleccionable), con una indicación de que el rol de administrador se asigna únicamente por quien opera el sistema. El formulario SHALL enviar siempre `rol: 'user'`, independientemente de la opción mostrada como deshabilitada. El formulario SHALL impedir el envío si contraseña y confirmar contraseña no coinciden, mostrando el error antes de contactar al backend. Si el backend rechaza el registro, el sistema SHALL mostrar el motivo del error de forma clara.

#### Scenario: Selector de rol solo permite "Usuario"
- **WHEN** la persona usuaria abre el formulario de registro y despliega el selector de rol
- **THEN** ve las opciones "Usuario" (seleccionable) y "Administrador" (deshabilitada), y no puede enviar el formulario con un rol distinto de "Usuario"

#### Scenario: Contraseñas no coinciden detectado en el cliente
- **WHEN** la persona usuaria escribe una contraseña y una confirmación distintas y presiona registrarse
- **THEN** el formulario muestra un error de validación y no envía la petición al backend

#### Scenario: Registro exitoso
- **WHEN** la persona usuaria completa el formulario con datos válidos y el backend confirma el registro
- **THEN** el sistema informa el éxito y permite continuar hacia el login

#### Scenario: Error del backend al registrar
- **WHEN** el backend rechaza el registro (por ejemplo, nombre de usuario ya existente)
- **THEN** el sistema muestra el mensaje de error devuelto por el backend, de forma legible

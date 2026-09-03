## Purpose

Da a la persona usuaria una forma de entrar y registrarse en la aplicación con una interfaz moderna, y evita que se acceda al contenido protegido sin sesión, o al login estando ya autenticado.

## ADDED Requirements

### Requirement: Estilo visual glassmorphism global
Todas las vistas de la aplicación SHALL usar un lenguaje visual de tipo glassmorphism: superficies traslúcidas con desenfoque de fondo, bordes sutiles semi-transparentes y sombras suaves sobre un fondo con gradiente, de forma consistente en login, registro y el resto de vistas de la app.

#### Scenario: Consistencia visual entre vistas
- **WHEN** la persona usuaria navega entre la vista de login, la de registro y el resto de la aplicación
- **THEN** todas comparten el mismo lenguaje visual (superficies translúcidas con desenfoque, bordes y sombras suaves) sobre el mismo fondo con gradiente

### Requirement: Registro desde el frontend
El sistema SHALL ofrecer un formulario de registro con los campos nombre, contraseña, confirmar contraseña y selección de rol (user o admin). El formulario SHALL impedir el envío si contraseña y confirmar contraseña no coinciden, mostrando el error antes de contactar al backend. Si el backend rechaza el registro, el sistema SHALL mostrar el motivo del error de forma clara.

#### Scenario: Contraseñas no coinciden detectado en el cliente
- **WHEN** la persona usuaria escribe una contraseña y una confirmación distintas y presiona registrarse
- **THEN** el formulario muestra un error de validación y no envía la petición al backend

#### Scenario: Registro exitoso
- **WHEN** la persona usuaria completa el formulario con datos válidos y el backend confirma el registro
- **THEN** el sistema informa el éxito y permite continuar hacia el login

#### Scenario: Error del backend al registrar
- **WHEN** el backend rechaza el registro (por ejemplo, nombre de usuario ya existente)
- **THEN** el sistema muestra el mensaje de error devuelto por el backend, de forma legible

### Requirement: Login y persistencia de sesión
El sistema SHALL ofrecer un formulario de login con usuario y contraseña. Al autenticarse correctamente, el sistema SHALL almacenar el token de sesión de forma que sobreviva a recargar la página, y SHALL redirigir a la vista principal. Si las credenciales son inválidas, el sistema SHALL mostrar un mensaje de error sin recargar la aplicación.

#### Scenario: Login exitoso
- **WHEN** la persona usuaria ingresa credenciales válidas
- **THEN** el sistema guarda la sesión, redirige a la vista principal, y una recarga posterior de la página mantiene la sesión activa

#### Scenario: Login con credenciales inválidas
- **WHEN** la persona usuaria ingresa credenciales incorrectas
- **THEN** el sistema muestra un mensaje de error y permanece en la vista de login

### Requirement: Protección de rutas por sesión
El sistema SHALL impedir el acceso a las vistas que requieren autenticación cuando no hay una sesión activa, redirigiendo a login. El sistema SHALL impedir el acceso a las vistas de login/registro cuando ya existe una sesión activa, redirigiendo a la vista principal.

#### Scenario: Acceso a vista protegida sin sesión
- **WHEN** una persona sin sesión activa intenta acceder a la vista principal directamente por URL
- **THEN** el sistema la redirige a la vista de login

#### Scenario: Acceso a login con sesión activa
- **WHEN** una persona con sesión activa intenta acceder a la vista de login
- **THEN** el sistema la redirige a la vista principal

### Requirement: Cierre de sesión ante token inválido
El sistema SHALL detectar cuando el backend responde que el token ya no es válido (expirado o rechazado) y SHALL cerrar la sesión localmente, redirigiendo a login.

#### Scenario: Token expira durante el uso
- **WHEN** una petición autenticada recibe una respuesta de token inválido/expirado desde el backend
- **THEN** el sistema borra la sesión almacenada y redirige a la vista de login

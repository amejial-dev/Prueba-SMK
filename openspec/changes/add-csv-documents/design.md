## Context

`add-user-auth` ya provee `authenticate`/`authorize` y el modelo `User`. `backend/uploads/` existe (con `.gitkeep`) como carpeta de almacenamiento local. Ver `proposal.md - Why` para la motivación.

## Goals / Non-Goals

**Goals:**
- Validar el CSV completo antes de tocar la base de datos (todo-o-nada), para que nunca queden documentos con filas parcialmente inválidas.
- Dejar el modelo de datos listo para que el frontend pueda pintar la tabla del dashboard directamente desde `GET /api/documents` sin transformar nada.

**Non-Goals:**
- Procesamiento asíncrono/colas para CSV grandes: fuera de alcance, se procesa síncronamente en el request.
- Edición de filas ya cargadas: solo carga, listado, descarga y eliminación del documento completo.

## Decisions

- **Dos tablas (`Document` + `DocumentRow`) en vez de guardar el CSV parseado como JSON**: permite contar registros con `COUNT` real y deja abierta la puerta a filtrar/consultar filas individuales si se pidiera después. Alternativa descartada: columna `jsonb` con las filas — más simple pero rompe la garantía de "número de registros" como dato consultable de forma barata.
- **Transacción de Sequelize al crear `Document` + sus `DocumentRow`**: si falla la inserción de alguna fila (no debería, ya se validó antes), se hace rollback y no queda un documento a medias.
- **Validación en dos pasos**: (1) parseo con `csv-parse` a un array de objetos, (2) validación fila por fila con un validador propio (`csvValidator.js`) que devuelve una lista de errores `{ fila, campo, mensaje }`. Si la lista no está vacía, se responde 400 sin llegar a Sequelize. Alternativa descartada: validar con `express-validator` sobre cada fila — está pensado para el body de la request, no para N filas dinámicas de un archivo.
- **multer con `diskStorage`** apuntando a `backend/uploads/`, nombrando el archivo con un prefijo único (timestamp + nombre original) para evitar colisiones; el nombre original se guarda aparte en `Document.nombreOriginal` para mostrarlo en el frontend.
- **Reglas de validación concretas** (para que el agente programador no improvise):
  - `correo`: debe pasar una validación de formato email (usar `validator` ya incluido transitivamente por `express-validator`, o una regex simple equivalente).
  - `nombre`: string no vacío tras `trim()`.
  - `telefono`: debe ser convertible a número (`/^\d+$/` sobre el valor tras trim, o `Number.isFinite` sobre `Number(valor)`), se persiste como string para no perder ceros a la izquierda.
  - `ciudad`: string no vacío tras `trim()`.
  - `notas`: opcional, se persiste tal cual o `null` si viene vacío.

## Risks / Trade-offs

- [Archivos subidos se acumulan en `backend/uploads/` sin límite] → Mitigación: fuera de alcance de la prueba; aceptado como limitación conocida, no oculta.
- [Procesamiento síncrono bloquea el event loop con CSV muy grandes] → Mitigación: aceptable para el volumen esperado en una prueba técnica; anotado como Non-Goal explícito.

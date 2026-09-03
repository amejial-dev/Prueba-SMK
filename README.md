# Prueba Técnica: Full Stack Developer (Node.js & Vue 3)

Gestor de documentos CSV con autenticación JWT y roles de usuario.

## Stack

- **Backend**: Node.js + Express + Sequelize (ORM) + PostgreSQL
- **Frontend**: Vue 3 (Option API) + Vue Router + Axios
- **Infraestructura**: Docker + docker-compose

## Estructura

```
.
├── backend/          # API REST (Express + Sequelize)
├── frontend/         # SPA (Vue 3)
└── docker-compose.yml
```

## Cómo levantar el proyecto

1. Copiar el archivo de variables de entorno del backend:

   ```
   cp backend/.env.example backend/.env
   ```

2. Levantar todo con Docker:

   ```
   docker compose up --build
   ```

   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173
   - PostgreSQL: localhost:5432

## Desarrollo local sin Docker (opcional)

```
cd backend && npm run dev
cd frontend && npm run dev
```

(requiere una instancia de PostgreSQL accesible según las variables de `backend/.env`)

## Estado

- [ ] Registro de usuarios (nombre, contraseña, confirmar contraseña, rol)
- [ ] Login con JWT
- [ ] Modelo de documentos CSV
- [ ] Endpoint de carga y validación de CSV
- [ ] Control de acceso por rol (RBAC)
- [ ] Vistas de Login / Registro
- [ ] Dashboard: carga (drag & drop), tabla de documentos, descarga, eliminación (admin)

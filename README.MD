# REST API - Plataforma de Peliculas y Series

Aplicacion web fullstack para la gestion y catalogo de peliculas y series de la Institucion Universitaria Digital de Antioquia. Backend desarrollado con **NestJS + TypeScript + PostgreSQL**, frontend con **React + Vite + Tailwind CSS**.

---

## Tabla de Contenidos

- [Descripcion del Proyecto](#descripcion-del-proyecto)
- [Stack Tecnologico](#stack-tecnologico)
- [Modelo de Datos](#modelo-de-datos)
- [Arquitectura Backend](#arquitectura-backend)
- [Frontend - Catalogo y Panel Admin](#frontend---catalogo-y-panel-admin)
- [Endpoints de la API](#endpoints-de-la-api)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalacion y Configuracion](#instalacion-y-configuracion)
- [Scripts Disponibles](#scripts-disponibles)
- [Seeds (Datos Iniciales)](#seeds-datos-iniciales)
- [Variables de Entorno](#variables-de-entorno)
- [Seguridad](#seguridad)
- [Entidades](#entidades)
- [Formato de Respuestas](#formato-de-respuestas)
- [Contexto Academico](#contexto-academico)

---

## Descripcion del Proyecto

La Institucion Universitaria Digital de Antioquia requiere una plataforma web tipo streaming para publicar peliculas y series en modo Administrador, ofreciendo a docentes, estudiantes, colaboradores y publico en general una experiencia de entretenimiento (con licencias pagadas por la universidad).

La arquitectura es **monolitica**, con **Frontend y Backend separados** en el mismo repositorio. El backend expone una REST API y el frontend consume esa API como SPA (Single Page Application).

---

## Stack Tecnologico

### Backend

| Categoria       | Tecnologia             | Version |
| --------------- | ---------------------- | ------- |
| Framework       | NestJS                 | 11.x   |
| Lenguaje        | TypeScript             | 5.x    |
| Base de Datos   | PostgreSQL             | 15+    |
| ORM             | TypeORM                | 0.3.x  |
| Auth            | JWT + Passport         | 11.x   |
| Validacion      | class-validator        | 0.14.x |
| Documentacion   | Swagger (OpenAPI)      | 11.x   |
| Logging         | Winston + Rotate Files | 3.x    |
| HTTP Security   | Helmet                 | 8.x    |
| Rate Limiting   | @nestjs/throttler      | 6.x    |
| Health Checks   | @nestjs/terminus       | 10.x   |
| WebSockets      | @nestjs/websockets     | 11.x   |
| Testing         | Jest + Supertest       | 29.x   |

### Frontend

| Categoria       | Tecnologia         | Version |
| --------------- | ------------------ | ------- |
| Framework       | React              | 19.x   |
| Build Tool      | Vite               | 7.x    |
| Lenguaje        | TypeScript         | 5.x    |
| Routing         | React Router DOM   | 7.x    |
| Estilos         | Tailwind CSS       | 3.x    |
| HTTP Client     | Axios              | 1.7.x  |
| Iconos          | Lucide React       | 0.470  |
| Alertas         | SweetAlert2        | 11.x   |
| Linting         | ESLint             | 9.x    |

---

## Modelo de Datos

```
                    ┌──────────┐
                    │  GENRE   │
                    │──────────│
                    │ name     │
                    │ description
                    │ isActive │
                    └────┬─────┘
                         │ 1
                         │
    ┌──────────┐    ┌────┴─────┐    ┌──────────┐
    │ DIRECTOR │    │  MEDIA   │    │ PRODUCER │
    │──────────│    │──────────│    │──────────│
    │ names    │───►│ serial   │◄───│ name     │
    │ isActive │ 1  │ title    │  1 │ slogan   │
    └──────────┘    │ synopsis │    │ description
                    │ url      │    │ isActive │
    ┌──────────┐    │ coverImage    └──────────┘
    │   TYPE   │    │ releaseYear
    │──────────│    │ genreId  │
    │ name     │───►│ directorId
    │ description  1│ producerId
    └──────────┘    │ typeId   │
                    └──────────┘

    ┌──────────┐    ┌──────────┐
    │   USER   │◄──►│   ROLE   │  (ManyToMany)
    │──────────│    │──────────│
    │ email    │    │ name     │
    │ password │    │ description
    │ isActive │    │ isActive │
    └──────────┘    └──────────┘
```

Cada **Media** (pelicula o serie) se relaciona con:
- Un **Genero** principal (solo generos activos)
- Un **Director** principal (solo directores activos)
- Una **Productora** principal (solo productoras activas)
- Un **Tipo** (pelicula, serie, etc.)

---

## Arquitectura Backend

### Flujo de Request

```
HTTP Request
    │
    ├── Middlewares
    │   ├── RequestIdMiddleware (UUIDv7)
    │   └── LoggerMiddleware (HTTP log)
    │
    ├── Guards (globales)
    │   ├── ThrottlerGuard (Rate limiting)
    │   ├── JwtAuthGuard (Auth JWT, bypass: @Public())
    │   └── RolesGuard (Autorizacion por rol, bypass: sin @Roles())
    │
    ├── Interceptors (globales)
    │   ├── LoggingInterceptor (Log a BD)
    │   ├── TransformInterceptor (Formato de respuesta)
    │   └── TimeoutInterceptor (30s)
    │
    ├── Pipes
    │   └── ValidationPipe (DTOs con class-validator)
    │
    ├── Controller -> Service -> Repository (createQueryBuilder)
    │
    ├── Success -> { success: true, data, message }
    └── Error   -> AllExceptionsFilter -> { success: false, code, message }
```

### Modulos del Backend

| Modulo     | Descripcion                                    |
| ---------- | ---------------------------------------------- |
| `auth`     | Autenticacion JWT (login, register, refresh)   |
| `user`     | Gestion de usuarios                            |
| `role`     | Roles y control de acceso RBAC                 |
| `genre`    | Generos de peliculas                           |
| `director` | Directores de producciones                     |
| `producer` | Productoras                                    |
| `type`     | Tipos de multimedia                            |
| `media`    | Peliculas y series                             |
| `catalog`  | API publica de catalogo (sin autenticacion)    |
| `health`   | Health checks y metricas del sistema           |
| `logger`   | Logging centralizado y auditoria               |

---

## Frontend - Catalogo y Panel Admin

### Catalogo Publico (tema oscuro, estilo streaming)

- **Home** (`/`) - Hero banner con contenido destacado + sliders por genero
- **Catalogo** (`/catalog`) - Busqueda con filtros (genero, tipo, anio), paginado, grid responsive
- **Detalle** (`/catalog/:id`) - Informacion completa del media (URL solo para usuarios autenticados)
- **Login** (`/login`) y **Registro** (`/register`)

### Panel de Administracion (tema claro, protegido por rol)

- **Dashboard** (`/admin`) - Metricas del sistema (health, memoria, base de datos, uptime)
- **Media** (`/admin/media`) - CRUD completo de peliculas y series
- **Directores** (`/admin/directors`) - CRUD de directores
- **Generos** (`/admin/genres`) - CRUD de generos
- **Productoras** (`/admin/producers`) - CRUD de productoras
- **Tipos** (`/admin/types`) - CRUD de tipos de multimedia
- **Roles** (`/admin/roles`) - Gestion de roles
- **Usuarios** (`/admin/users`) - Gestion de usuarios

### Caracteristicas del Frontend

- **Autenticacion** - Login con JWT, refresh automatico de tokens, contexto global (AuthContext)
- **RBAC** - Rutas admin protegidas, requieren rol "administrador"
- **Busqueda** - Busqueda en vivo con debounce (350ms), previews con thumbnails
- **Responsive** - Mobile-first con Tailwind, sidebar colapsable, grids adaptativos (2-5 columnas)
- **Alertas** - SweetAlert2 para confirmaciones, errores y notificaciones
- **Interceptores Axios** - Inyeccion automatica de JWT, refresh en 401, manejo global de errores

---

## Endpoints de la API

Prefijo global: `/api/v1`

### Autenticacion (`/auth`)

| Metodo | Ruta            | Descripcion               | Acceso  |
| ------ | --------------- | ------------------------- | ------- |
| POST   | /auth/register  | Registrar usuario         | Publico |
| POST   | /auth/login     | Iniciar sesion            | Publico |
| POST   | /auth/refresh   | Refrescar token           | Publico |
| GET    | /auth/profile   | Obtener perfil autenticado| Auth    |

### Catalogo (`/catalog`) - API Publica

| Metodo | Ruta              | Descripcion                                | Acceso  |
| ------ | ----------------- | ------------------------------------------ | ------- |
| GET    | /catalog          | Listado paginado con filtros               | Publico |
| GET    | /catalog/featured | Media destacada (10 mas recientes)         | Publico |
| GET    | /catalog/genres   | Generos activos para filtros               | Publico |
| GET    | /catalog/types    | Tipos para filtros                         | Publico |
| GET    | /catalog/:id      | Detalle de media (URL solo si autenticado) | Publico |

### Genero (`/genres`)

| Metodo | Ruta          | Descripcion              | Acceso |
| ------ | ------------- | ------------------------ | ------ |
| POST   | /genres       | Crear genero             | Admin  |
| GET    | /genres       | Listar generos (paginado)| Admin  |
| GET    | /genres/:id   | Obtener genero por ID    | Admin  |
| PUT    | /genres/:id   | Actualizar genero        | Admin  |
| DELETE | /genres/:id   | Eliminar genero          | Admin  |

### Director (`/directors`)

| Metodo | Ruta             | Descripcion                 | Acceso |
| ------ | ---------------- | --------------------------- | ------ |
| POST   | /directors       | Crear director              | Admin  |
| GET    | /directors       | Listar directores (paginado)| Admin  |
| GET    | /directors/:id   | Obtener director por ID     | Admin  |
| PUT    | /directors/:id   | Actualizar director         | Admin  |
| DELETE | /directors/:id   | Eliminar director           | Admin  |

### Productora (`/producers`)

| Metodo | Ruta              | Descripcion                   | Acceso |
| ------ | ----------------- | ----------------------------- | ------ |
| POST   | /producers        | Crear productora              | Admin  |
| GET    | /producers        | Listar productoras (paginado) | Admin  |
| GET    | /producers/:id    | Obtener productora por ID     | Admin  |
| PUT    | /producers/:id    | Actualizar productora         | Admin  |
| DELETE | /producers/:id    | Eliminar productora           | Admin  |

### Tipo (`/types`)

| Metodo | Ruta          | Descripcion              | Acceso |
| ------ | ------------- | ------------------------ | ------ |
| POST   | /types        | Crear tipo               | Admin  |
| GET    | /types        | Listar tipos (paginado)  | Admin  |
| GET    | /types/:id    | Obtener tipo por ID      | Admin  |
| PUT    | /types/:id    | Actualizar tipo          | Admin  |
| DELETE | /types/:id    | Eliminar tipo            | Admin  |

### Media (`/media`)

| Metodo | Ruta          | Descripcion                             | Acceso |
| ------ | ------------- | --------------------------------------- | ------ |
| POST   | /media        | Crear pelicula/serie                    | Admin  |
| GET    | /media        | Listar media (paginado, con relaciones) | Admin  |
| GET    | /media/:id    | Obtener media por ID (con relaciones)   | Admin  |
| PUT    | /media/:id    | Actualizar media                        | Admin  |
| DELETE | /media/:id    | Eliminar media                          | Admin  |

### Usuarios (`/users`)

| Metodo | Ruta          | Descripcion             | Acceso |
| ------ | ------------- | ----------------------- | ------ |
| POST   | /users        | Crear usuario           | Admin  |
| GET    | /users        | Listar usuarios         | Admin  |
| GET    | /users/:id    | Obtener usuario por ID  | Admin  |
| PUT    | /users/:id    | Actualizar usuario      | Admin  |
| DELETE | /users/:id    | Eliminar usuario        | Admin  |

### Roles (`/roles`)

| Metodo | Ruta          | Descripcion           | Acceso |
| ------ | ------------- | --------------------- | ------ |
| POST   | /roles        | Crear rol             | Admin  |
| GET    | /roles        | Listar roles          | Admin  |
| GET    | /roles/:id    | Obtener rol por ID    | Admin  |
| PUT    | /roles/:id    | Actualizar rol        | Admin  |
| DELETE | /roles/:id    | Eliminar rol          | Admin  |

### Health (`/health`)

| Metodo | Ruta                     | Descripcion              | Acceso  |
| ------ | ------------------------ | ------------------------ | ------- |
| GET    | /health                  | Liveness check           | Publico |
| GET    | /health/ready            | Readiness check          | Publico |
| GET    | /health/database         | Estado de base de datos  | Publico |
| GET    | /health/memory           | Estado de memoria        | Publico |
| GET    | /health/disk             | Estado de disco          | Publico |
| GET    | /health/metrics/database | Metricas de BD           | Publico |
| GET    | /health/metrics/memory   | Metricas de memoria      | Publico |
| GET    | /health/info             | Informacion del sistema  | Publico |

### Logs (`/logs`)

| Metodo | Ruta                     | Descripcion                  | Acceso  |
| ------ | ------------------------ | ---------------------------- | ------- |
| POST   | /logs                    | Crear entrada de log         | Publico |
| GET    | /logs                    | Listar logs (con filtros)    | Publico |
| GET    | /logs/:id                | Obtener log por ID           | Publico |
| GET    | /logs/trace/:requestId   | Trazar logs por request ID   | Publico |
| GET    | /logs/user/:userId       | Logs de un usuario           | Publico |
| GET    | /logs/errors/recent      | Errores recientes            | Publico |
| GET    | /logs/stats/grouped      | Estadisticas agrupadas       | Publico |
| GET    | /logs/stats/summary      | Resumen de logs              | Publico |
| DELETE | /logs/cleanup            | Limpiar logs antiguos        | Publico |
| POST   | /logs/flush              | Forzar flush del buffer      | Publico |

---

## Estructura del Proyecto

```
Rest-API/
├── docs/
│   └── plans/
│       └── NUEVO-OBJETIVO.md         # Caso de estudio (requerimientos)
│
├── src/                               # ── BACKEND (NestJS) ──
│   ├── config/                        # Configuraciones (DB, JWT, Swagger, etc.)
│   ├── constants/                     # ERROR_CODES, ROLES, HTTP_STATUS
│   ├── decorators/                    # @Public, @Roles, @ApiResponse
│   ├── filters/                       # AllExceptionsFilter, ValidationExceptionFilter
│   ├── guards/                        # JwtAuthGuard, RolesGuard, ThrottlerGuard
│   ├── interceptors/                  # Logging, Timeout, Transform
│   ├── middleware/                     # RequestId, Logger
│   ├── database/
│   │   ├── migrations/                # Migraciones TypeORM
│   │   ├── seeds/                     # Datos iniciales
│   │   └── scripts/                   # Bootstrap admin, tenants
│   │
│   ├── modules/
│   │   ├── auth/                      # Autenticacion (JWT + Passport)
│   │   ├── user/                      # Usuarios
│   │   ├── role/                      # Roles (RBAC)
│   │   ├── genre/                     # Generos de peliculas
│   │   ├── director/                  # Directores
│   │   ├── producer/                  # Productoras
│   │   ├── type/                      # Tipos de multimedia
│   │   ├── media/                     # Peliculas y series
│   │   ├── catalog/                   # API publica de catalogo
│   │   ├── health/                    # Health checks y metricas
│   │   └── logger/                    # Logging centralizado
│   │
│   └── shared/
│       ├── common/                    # SanitizerService, HandleErrorService, DTOs base
│       └── utils/                     # Helpers (crypto, date, string, validation)
│
├── web/                               # ── FRONTEND (React + Vite) ──
│   ├── src/
│   │   ├── pages/                     # Paginas de la aplicacion
│   │   │   ├── Login.tsx              # Inicio de sesion
│   │   │   ├── Register.tsx           # Registro de usuario
│   │   │   ├── Dashboard.tsx          # Dashboard admin (metricas)
│   │   │   ├── MediaPage.tsx          # CRUD de media
│   │   │   ├── DirectorsPage.tsx      # CRUD de directores
│   │   │   ├── GenresPage.tsx         # CRUD de generos
│   │   │   ├── ProducersPage.tsx      # CRUD de productoras
│   │   │   ├── TypesPage.tsx          # CRUD de tipos
│   │   │   ├── RolesPage.tsx          # CRUD de roles
│   │   │   ├── UsersPage.tsx          # CRUD de usuarios
│   │   │   └── catalog/
│   │   │       ├── HomePage.tsx       # Home con hero + sliders por genero
│   │   │       ├── CatalogPage.tsx    # Catalogo con busqueda y filtros
│   │   │       └── MediaDetailPage.tsx # Detalle de pelicula/serie
│   │   ├── components/                # Componentes reutilizables
│   │   │   ├── Layout.tsx             # Layout admin con sidebar
│   │   │   ├── Modal.tsx              # Modal generico
│   │   │   ├── Pagination.tsx         # Paginacion de tablas
│   │   │   ├── SearchBar.tsx          # Barra de busqueda
│   │   │   ├── ConfirmDialog.tsx      # Dialogos de confirmacion
│   │   │   └── catalog/              # Componentes del catalogo publico
│   │   │       ├── CatalogLayout.tsx  # Layout catalogo con navbar
│   │   │       ├── CatalogNavbar.tsx  # Navbar sticky con busqueda
│   │   │       ├── HeroBanner.tsx     # Banner hero
│   │   │       ├── MediaCard.tsx      # Tarjeta de media
│   │   │       ├── MediaSlider.tsx    # Slider horizontal
│   │   │       └── FilterBar.tsx      # Barra de filtros
│   │   ├── context/
│   │   │   └── AuthContext.tsx         # Estado global de autenticacion
│   │   ├── services/                  # Servicios HTTP y gateways
│   │   ├── hooks/                     # Custom hooks (useCatalog, useCrud)
│   │   ├── types/                     # Interfaces TypeScript
│   │   └── constants/                 # Constantes de la app
│   ├── vite.config.js                 # Config de Vite + proxy al backend
│   ├── tailwind.config.js             # Config de Tailwind CSS
│   └── package.json
│
├── test/                              # Tests E2E
├── .env.example                       # Variables de entorno de ejemplo
└── package.json                       # Dependencias del backend
```

---

## Instalacion y Configuracion

### Prerequisitos

- Node.js 18+
- PostgreSQL 15+
- Yarn

### Backend

```bash
# Clonar e instalar
git clone <repository-url>
cd Rest-API
yarn install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# Ejecutar migraciones
yarn migration:run

# Ejecutar seeds (datos iniciales)
yarn seed

# Iniciar en desarrollo
yarn start:dev
```

### Frontend

```bash
# Instalar dependencias del frontend
yarn web:install

# Iniciar en desarrollo
yarn web:dev
```

### URLs en Desarrollo

| Servicio            | URL                        |
| ------------------- | -------------------------- |
| Backend API         | http://localhost:3000       |
| Swagger Docs        | http://localhost:3000/docs  |
| Frontend (Vite)     | http://localhost:5173       |

> El frontend en desarrollo usa un proxy de Vite para redirigir `/api` al backend en `localhost:3000`.

---

## Scripts Disponibles

### Backend

| Script                    | Descripcion                            |
| ------------------------- | -------------------------------------- |
| `yarn start:dev`          | Desarrollo con hot-reload              |
| `yarn build`              | Compilar para produccion               |
| `yarn start:prod`         | Iniciar en produccion                  |
| `yarn test`               | Unit tests                             |
| `yarn test:e2e`           | E2E tests                              |
| `yarn test:cov`           | Coverage (umbral minimo 80%)           |
| `yarn lint`               | ESLint                                 |
| `yarn format`             | Prettier                               |
| `yarn migration:run`      | Ejecutar migraciones                   |
| `yarn migration:generate` | Generar migracion                      |
| `yarn seed`               | Ejecutar seeds                         |
| `yarn bootstrap:admin`    | Crear usuario administrador manual     |
| `yarn docs`               | Generar documentacion Compodoc         |

### Frontend

| Script                    | Descripcion                            |
| ------------------------- | -------------------------------------- |
| `yarn web:dev`            | Servidor de desarrollo Vite            |
| `yarn web:build`          | Build de produccion                    |
| `yarn web:install`        | Instalar dependencias del frontend     |
| `yarn web:lint`           | ESLint del frontend                    |

---

## Seeds (Datos Iniciales)

```bash
yarn seed
```

| Tipo           | Datos                                                  |
| -------------- | ------------------------------------------------------ |
| **Generos**    | Accion, Aventura, Ciencia Ficcion, Drama, Terror       |
| **Directores** | Directores de ejemplo                                  |
| **Productoras**| Productoras de ejemplo                                 |
| **Tipos**      | Pelicula, Serie                                        |
| **Roles**      | admin, user                                            |
| **Usuarios**   | Usuarios de prueba con roles asignados                 |

---

## Variables de Entorno

Las principales variables a configurar en `.env` (ver `.env.example` para la lista completa):

| Variable                | Descripcion                          | Ejemplo                |
| ----------------------- | ------------------------------------ | ---------------------- |
| `NODE_ENV`              | Entorno de ejecucion                 | `development`          |
| `APP_PORT`              | Puerto del servidor                  | `3000`                 |
| `API_PREFIX`            | Prefijo global de la API             | `api/v1`               |
| `DB_HOST`               | Host de PostgreSQL                   | `localhost`            |
| `DB_PORT`               | Puerto de PostgreSQL                 | `5432`                 |
| `DB_USERNAME`           | Usuario de BD                        | `postgres`             |
| `DB_PASSWORD`           | Password de BD                       | `****`                 |
| `DB_DATABASE`           | Nombre de la BD                      | `rest_db`              |
| `JWT_SECRET`            | Clave secreta para access tokens     | (min 32 caracteres)    |
| `JWT_REFRESH_SECRET`    | Clave secreta para refresh tokens    | (min 32 caracteres)    |
| `JWT_EXPIRES_IN`        | Expiracion del access token          | `15m`                  |
| `JWT_REFRESH_EXPIRES_IN`| Expiracion del refresh token         | `7d`                   |
| `BCRYPT_ROUNDS`         | Rondas de hashing bcrypt             | `12`                   |
| `THROTTLE_TTL`          | Ventana de rate limiting (segundos)  | `60`                   |
| `THROTTLE_LIMIT`        | Max requests por ventana             | `10`                   |
| `SWAGGER_ENABLED`       | Habilitar Swagger UI                 | `true`                 |
| `LOG_DB_LEVEL`          | Nivel de logging en BD               | `info`                 |

Tambien soporta configuracion para: Redis, SMTP (email), Twilio (SMS), Firebase (push), tareas programadas (cron jobs), y storage.

---

## Seguridad

- **JWT Authentication** - Tokens de acceso (15m) y refresh (7d) para sesiones
- **RBAC** - Control de acceso basado en roles (Admin requerido para gestion de contenido)
- **Rate Limiting** - Proteccion contra abuso con ThrottlerGuard
- **Helmet** - Headers HTTP de seguridad
- **CORS** - Configuracion de origenes permitidos
- **Validacion** - DTOs con class-validator en todos los endpoints
- **Sanitizacion** - SanitizerService para limpiar inputs contra XSS
- **Bcrypt** - Hashing de passwords con 12 rondas
- **Soft Delete** - Eliminacion logica de usuarios
- **Request ID** - UUIDv7 en cada request para trazabilidad

---

## Entidades

### GenreEntity
| Campo       | Tipo         | Notas             |
| ----------- | ------------ | ----------------- |
| id          | UUID         | PK, auto-generado |
| name        | varchar(100) | Unico, indexado   |
| description | text         | Nullable          |
| isActive    | boolean      | Default: true     |
| createdAt   | timestamp    | Auto              |
| updatedAt   | timestamp    | Auto              |

### DirectorEntity
| Campo     | Tipo         | Notas             |
| --------- | ------------ | ----------------- |
| id        | UUID         | PK, auto-generado |
| names     | varchar(150) | Indexado          |
| isActive  | boolean      | Default: true     |
| createdAt | timestamp    | Auto              |
| updatedAt | timestamp    | Auto              |

### ProducerEntity
| Campo       | Tipo         | Notas             |
| ----------- | ------------ | ----------------- |
| id          | UUID         | PK, auto-generado |
| name        | varchar(150) | Unico, indexado   |
| slogan      | varchar(255) | Nullable          |
| description | text         | Nullable          |
| isActive    | boolean      | Default: true     |
| createdAt   | timestamp    | Auto              |
| updatedAt   | timestamp    | Auto              |

### TypeEntity
| Campo       | Tipo         | Notas             |
| ----------- | ------------ | ----------------- |
| id          | UUID         | PK, auto-generado |
| name        | varchar(100) | Unico, indexado   |
| description | text         | Nullable          |
| createdAt   | timestamp    | Auto              |
| updatedAt   | timestamp    | Auto              |

### MediaEntity
| Campo      | Tipo         | Notas                    |
| ---------- | ------------ | ------------------------ |
| id         | UUID         | PK, auto-generado        |
| serial     | varchar(100) | Unico, indexado          |
| title      | varchar(255) | Indexado                 |
| synopsis   | text         | Nullable                 |
| url        | varchar(500) | Unico                   |
| coverImage | varchar(500) | Nullable                 |
| releaseYear| int          | Anio de estreno          |
| genreId    | UUID         | FK -> GenreEntity        |
| directorId | UUID         | FK -> DirectorEntity     |
| producerId | UUID         | FK -> ProducerEntity     |
| typeId     | UUID         | FK -> TypeEntity         |
| createdAt  | timestamp    | Auto                     |
| updatedAt  | timestamp    | Auto                     |

### UserEntity
| Campo     | Tipo         | Notas                        |
| --------- | ------------ | ---------------------------- |
| id        | UUID         | PK, auto-generado            |
| firstName | varchar(100) |                              |
| lastName  | varchar(100) |                              |
| email     | varchar(255) | Unico, indexado              |
| password  | varchar(255) | Hasheado con bcrypt          |
| isActive  | boolean      | Default: true                |
| createdAt | timestamp    | Auto                         |
| updatedAt | timestamp    | Auto                         |
| deletedAt | timestamp    | Soft delete, nullable        |
| roles     | ManyToMany   | Relacion con RoleEntity      |

### RoleEntity
| Campo       | Tipo         | Notas             |
| ----------- | ------------ | ----------------- |
| id          | UUID         | PK, auto-generado |
| name        | varchar(100) | Unico, indexado   |
| description | text         | Nullable          |
| isActive    | boolean      | Default: true     |
| createdAt   | timestamp    | Auto              |
| updatedAt   | timestamp    | Auto              |

---

## Formato de Respuestas

### Respuesta exitosa
```json
{
  "success": true,
  "message": "Operacion exitosa",
  "data": { ... }
}
```

### Respuesta con error
```json
{
  "success": false,
  "message": "Descripcion del error",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

### Respuesta paginada
```json
{
  "success": true,
  "message": "Lista obtenida",
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

## Contexto Academico

Este proyecto forma parte del caso de estudio de la **Institucion Universitaria Digital de Antioquia**, donde el equipo actua como Ingenieros Web FullStack. El objetivo es desarrollar una plataforma de streaming con gestion administrativa completa y catalogo publico.

**Documento de requerimientos:** [docs/plans/NUEVO-OBJETIVO.md](docs/plans/NUEVO-OBJETIVO.md)

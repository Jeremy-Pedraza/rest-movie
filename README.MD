# REST API - Plataforma de Peliculas y Series

Backend API para la gestion de peliculas y series de la Institucion Universitaria Digital de Antioquia. Desarrollado con NestJS, TypeScript y PostgreSQL.

---

## Descripcion del Proyecto

La Institucion Universitaria Digital de Antioquia requiere una aplicacion web para publicar peliculas y series en modo Administrador, ofreciendo a docentes, estudiantes, colaboradores y publico en general una plataforma de entretenimiento tipo "Cuevana" (sin pirateria, con licencias pagadas por la universidad).

La arquitectura es **monolitica**, con Frontend y Backend separados. Este repositorio contiene el **Backend (REST API)** con los siguientes modulos definidos por el equipo de tecnologia:

- **Genero** - Clasificacion de peliculas (accion, aventura, ciencia ficcion, drama, terror, etc.)
- **Director** - Director principal de cada produccion
- **Productora** - Empresa productora (Disney, Warner, Paramount, etc.)
- **Tipo** - Tipo de multimedia (pelicula, serie, etc.)
- **Media** - Peliculas y series con sus relaciones a genero, director, productora y tipo

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
```

Cada **Media** (pelicula o serie) se relaciona con:
- Un **Genero** principal (solo generos activos)
- Un **Director** principal (solo directores activos)
- Una **Productora** principal (solo productoras activas)
- Un **Tipo** (pelicula, serie, etc.)

---

## Modulos y Endpoints

### Genero (`/genres`)

Gestion de generos de peliculas. Campos: nombre, descripcion, estado (activo/inactivo).

| Metodo | Ruta          | Descripcion              | Acceso |
| ------ | ------------- | ------------------------ | ------ |
| POST   | /genres       | Crear genero             | Admin  |
| GET    | /genres       | Listar generos (paginado)| Admin  |
| GET    | /genres/:id   | Obtener genero por ID    | Admin  |
| PUT    | /genres/:id   | Actualizar genero        | Admin  |
| DELETE | /genres/:id   | Eliminar genero          | Admin  |

### Director (`/directors`)

Gestion de directores de producciones. Campos: nombres, estado (activo/inactivo).

| Metodo | Ruta             | Descripcion                 | Acceso |
| ------ | ---------------- | --------------------------- | ------ |
| POST   | /directors       | Crear director              | Admin  |
| GET    | /directors       | Listar directores (paginado)| Admin  |
| GET    | /directors/:id   | Obtener director por ID     | Admin  |
| PUT    | /directors/:id   | Actualizar director         | Admin  |
| DELETE | /directors/:id   | Eliminar director           | Admin  |

### Productora (`/producers`)

Gestion de productoras. Campos: nombre, slogan, descripcion, estado (activo/inactivo).

| Metodo | Ruta              | Descripcion                   | Acceso |
| ------ | ----------------- | ----------------------------- | ------ |
| POST   | /producers        | Crear productora              | Admin  |
| GET    | /producers        | Listar productoras (paginado) | Admin  |
| GET    | /producers/:id    | Obtener productora por ID     | Admin  |
| PUT    | /producers/:id    | Actualizar productora         | Admin  |
| DELETE | /producers/:id    | Eliminar productora           | Admin  |

### Tipo (`/types`)

Gestion de tipos de multimedia. Campos: nombre, descripcion.

| Metodo | Ruta          | Descripcion              | Acceso |
| ------ | ------------- | ------------------------ | ------ |
| POST   | /types        | Crear tipo               | Admin  |
| GET    | /types        | Listar tipos (paginado)  | Admin  |
| GET    | /types/:id    | Obtener tipo por ID      | Admin  |
| PUT    | /types/:id    | Actualizar tipo          | Admin  |
| DELETE | /types/:id    | Eliminar tipo            | Admin  |

### Media (`/media`)

Gestion de peliculas y series. Campos: serial (unico), titulo, sinopsis, URL (unica), imagen de portada, anio de estreno, y relaciones con genero, director, productora y tipo.

| Metodo | Ruta          | Descripcion                          | Acceso |
| ------ | ------------- | ------------------------------------ | ------ |
| POST   | /media        | Crear pelicula/serie                 | Admin  |
| GET    | /media        | Listar media (paginado, con relaciones) | Admin  |
| GET    | /media/:id    | Obtener media por ID (con relaciones)| Admin  |
| PUT    | /media/:id    | Actualizar media                     | Admin  |
| DELETE | /media/:id    | Eliminar media                       | Admin  |

### Autenticacion (`/auth`)

Registro, login y gestion de sesion con JWT.

| Metodo | Ruta            | Descripcion               | Acceso  |
| ------ | --------------- | ------------------------- | ------- |
| POST   | /auth/register  | Registrar usuario         | Publico |
| POST   | /auth/login     | Iniciar sesion            | Publico |
| POST   | /auth/refresh   | Refrescar token           | Publico |
| GET    | /auth/profile   | Obtener perfil autenticado| Auth    |

### Roles (`/roles`)

Gestion de roles para control de acceso (RBAC).

| Metodo | Ruta          | Descripcion           | Acceso |
| ------ | ------------- | --------------------- | ------ |
| POST   | /roles        | Crear rol             | Admin  |
| GET    | /roles        | Listar roles          | Admin  |
| GET    | /roles/:id    | Obtener rol por ID    | Admin  |
| PUT    | /roles/:id    | Actualizar rol        | Admin  |
| DELETE | /roles/:id    | Eliminar rol          | Admin  |

### Health (`/health`)

Monitoreo del estado de la aplicacion.

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

Sistema centralizado de logging y auditoria.

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

## Stack Tecnologico

| Categoria      | Tecnologia        | Version |
| -------------- | ----------------- | ------- |
| Framework      | NestJS            | 11.x   |
| Lenguaje       | TypeScript        | 5.x    |
| Base de Datos  | PostgreSQL        | 15+    |
| ORM            | TypeORM           | 0.3.x  |
| Auth           | JWT + Passport    | 11.x   |
| Validacion     | class-validator   | 0.14.x |
| Documentacion  | Swagger           | 11.x   |
| Logging        | Winston           | 3.x    |
| HTTP Security  | Helmet            | 8.x    |
| Rate Limiting  | @nestjs/throttler | 6.x    |
| Testing        | Jest + Supertest  | 29.x   |

---

## Arquitectura - Flujo de Request

```
HTTP Request
    |
    +-- Middlewares
    |   +-- RequestIdMiddleware (UUIDv7)
    |   +-- LoggerMiddleware (HTTP log)
    |
    +-- Guards (globales)
    |   +-- ThrottlerGuard (Rate limiting)
    |   +-- JwtAuthGuard (Auth JWT, bypass: @Public())
    |   +-- RolesGuard (Autorizacion por rol, bypass: sin @Roles())
    |
    +-- Interceptors (globales)
    |   +-- LoggingInterceptor (Log a BD)
    |   +-- TransformInterceptor (Formato de respuesta)
    |   +-- TimeoutInterceptor (30s)
    |
    +-- Pipes
    |   +-- ValidationPipe (DTOs con class-validator)
    |
    +-- Controller -> Service -> Repository (createQueryBuilder)
    |
    +-- Success -> { success: true, data, message }
    +-- Error   -> AllExceptionsFilter -> { success: false, code, message }
```

---

## Estructura del Proyecto

```
Rest-API/
+-- docs/
|   +-- plans/
|       +-- NUEVO-OBJETIVO.md       # Caso de estudio (requerimientos)
|
+-- src/
|   +-- config/                     # Configuraciones (DB, JWT, Swagger, etc.)
|   +-- constants/                  # ERROR_CODES, ROLES, HTTP_STATUS
|   +-- decorators/                 # @Public, @Roles, @ApiResponse
|   +-- filters/                    # AllExceptionsFilter, ValidationExceptionFilter
|   +-- guards/                     # JwtAuthGuard, RolesGuard, ThrottlerGuard
|   +-- interceptors/               # Logging, Timeout, Transform
|   +-- middleware/                  # RequestId, Logger
|   +-- database/
|   |   +-- migrations/             # Migraciones TypeORM
|   |   +-- seeds/                  # Datos iniciales
|   |
|   +-- modules/
|   |   +-- auth/                   # Autenticacion (JWT)
|   |   +-- user/                   # Usuarios
|   |   +-- role/                   # Roles (RBAC)
|   |   +-- genre/                  # Generos de peliculas
|   |   +-- director/               # Directores
|   |   +-- producer/               # Productoras
|   |   +-- type/                   # Tipos de multimedia
|   |   +-- media/                  # Peliculas y series
|   |   +-- health/                 # Health checks
|   |   +-- logger/                 # Logging centralizado
|   |
|   +-- shared/
|       +-- common/                 # SanitizerService, HandleErrorService, DTOs base
|       +-- utils/                  # Helpers (crypto, date, string, validation)
|
+-- test/                           # Tests
```

---

## Instalacion

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

# Ejecutar seeds (datos iniciales: generos, directores, productoras, tipos, roles, usuarios)
yarn seed

# Iniciar en desarrollo
yarn start:dev
```

**URLs:**

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs

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

## Scripts

| Script                    | Descripcion                   |
| ------------------------- | ----------------------------- |
| `yarn start:dev`          | Desarrollo con hot-reload     |
| `yarn build`              | Compilar para produccion      |
| `yarn start:prod`         | Iniciar produccion            |
| `yarn test`               | Unit tests                    |
| `yarn test:e2e`           | E2E tests                     |
| `yarn test:cov`           | Coverage                      |
| `yarn lint`               | ESLint                        |
| `yarn format`             | Prettier                      |
| `yarn migration:run`      | Ejecutar migraciones          |
| `yarn migration:generate` | Generar migracion             |
| `yarn seed`               | Ejecutar seeds                |
| `yarn docs`               | Generar documentacion Compodoc|

---

## Seguridad

- **JWT Authentication**: Tokens de acceso y refresh para sesiones
- **RBAC**: Control de acceso basado en roles (Admin requerido para gestion de contenido)
- **Rate Limiting**: Proteccion contra abuso con ThrottlerGuard
- **Helmet**: Headers HTTP de seguridad
- **Validacion**: DTOs con class-validator en todos los endpoints
- **Sanitizacion**: SanitizerService para limpiar inputs

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

Este proyecto forma parte del caso de estudio de la **Institucion Universitaria Digital de Antioquia**, donde el equipo actua como Ingenieros Web FullStack. El objetivo actual es la gestion de peliculas en calidad de Administrador. No se requiere sistema de registro para usuarios finales ni modulos de seguridad avanzados por el momento.

**Documento de requerimientos:** [docs/plans/NUEVO-OBJETIVO.md](docs/plans/NUEVO-OBJETIVO.md)

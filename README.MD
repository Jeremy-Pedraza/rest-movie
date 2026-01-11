# 🚀 Mokka Backend API

NestJS Backend API - Production Ready

---

## 📊 Estado del Proyecto

| Categoría | Estado | Progreso |
|-----------|--------|----------|
| Configuración Base | ✅ Completo | 100% |
| Shared Modules | ✅ Completo | 100% |
| Feature Modules | 🔄 En progreso | 40% |
| Database (Migraciones) | ⏳ Pendiente | 10% |
| Testing | ⏳ Pendiente | 10% |

> **Última actualización:** Enero 2025 - Sesión 7

---

## 📋 Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **NestJS** | 11.x | Framework principal |
| **TypeScript** | 5.x | Lenguaje |
| **PostgreSQL** | 15+ | Base de datos |
| **TypeORM** | 0.3.x | ORM |
| **Redis** | 7+ | Cache + Sessions + Queues |
| **Bull** | 4.x | Job queues |
| **Passport** | 0.7.x | Autenticación |
| **JWT** | - | Tokens |
| **Winston** | 3.x | Logging |
| **Swagger** | 11.x | Documentación API |
| **Jest** | 29.x | Testing |

---

## 🛠️ Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd mokka-backend

# Instalar dependencias
yarn install

# Copiar variables de entorno
cp .env.example .env

# Configurar base de datos y redis en .env

# Ejecutar migraciones (cuando estén disponibles)
yarn migration:run

# Ejecutar seeds (cuando estén disponibles)
yarn seed
```

---

## 🚀 Ejecución

```bash
# Desarrollo (hot-reload)
yarn start:dev

# Debug
yarn start:debug

# Producción
yarn build
yarn start:prod
```

---

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `yarn start:dev` | Desarrollo con hot-reload |
| `yarn start:debug` | Modo debug |
| `yarn start:prod` | Producción |
| `yarn build` | Compilar |
| `yarn lint` | ESLint |
| `yarn format` | Prettier |
| `yarn test` | Tests unitarios |
| `yarn test:watch` | Tests en watch mode |
| `yarn test:cov` | Tests con coverage |
| `yarn test:e2e` | Tests E2E |
| `yarn migration:generate` | Generar migración |
| `yarn migration:run` | Ejecutar migraciones |
| `yarn migration:revert` | Revertir migración |
| `yarn seed` | Ejecutar seeds |
| `yarn docs` | Generar documentación |

---

## 📂 Estructura del Proyecto

```
src/
├── @types/              # TypeScript type definitions
├── config/              # Configuraciones (DB, Redis, JWT, etc.)
├── constants/           # Constantes globales
├── database/            # Migraciones, seeds, factories
├── decorators/          # Decoradores personalizados
├── filters/             # Exception filters (con logging BD)
├── guards/              # Guards de autenticación
├── interceptors/        # Interceptores (con logging BD)
├── middleware/          # Middleware
├── modules/             # Módulos de la aplicación
│   ├── health/          # ✅ Health checks
│   ├── logger/          # ✅ Logging persistente
│   ├── user/            # ✅ Gestión de usuarios
│   └── auth/            # ⏳ Autenticación
├── pipes/               # Pipes de validación
├── shared/              # Módulos compartidos
│   ├── common/          # ✅ DTOs, entities, interfaces
│   ├── database/        # ✅ TransactionService
│   ├── redis/           # ✅ RedisService (60+ métodos)
│   ├── router/          # ✅ HTTP Client (Axios)
│   └── utils/           # ✅ Helpers
├── app.module.ts        # Módulo principal
└── main.ts              # Bootstrap
```

---

## 🔌 Módulos Implementados

### ✅ Health Module (`/health`)

Monitoreo de salud de la aplicación con Terminus.

| Endpoint | Descripción |
|----------|-------------|
| `GET /health` | Liveness probe |
| `GET /health/ready` | Readiness probe (DB + Redis + Memory + Disk) |
| `GET /health/database` | Estado de PostgreSQL |
| `GET /health/redis` | Estado de Redis |
| `GET /health/memory` | Estado de memoria |
| `GET /health/disk` | Estado de disco |
| `GET /health/metrics/database` | Métricas detalladas DB |
| `GET /health/metrics/redis` | Métricas detalladas Redis |
| `GET /health/info` | Información del sistema |

### ✅ Logger Module (`/logs`)

Logging persistente en base de datos con buffer y auto-flush.

**Características:**
- Buffer de 100 logs o flush cada 5 segundos
- Niveles: error, warn, info, debug, verbose
- Contextos: http, database, auth, business, system, queue, cache, external
- Tracing por requestId
- Integración automática con interceptors y filters
- Configurable por ambiente

| Endpoint | Descripción |
|----------|-------------|
| `POST /logs` | Crear log |
| `GET /logs` | Listar con filtros y paginación |
| `GET /logs/:id` | Obtener por ID |
| `GET /logs/trace/:requestId` | Logs por request (tracing) |
| `GET /logs/user/:userId` | Logs por usuario |
| `GET /logs/errors/recent` | Errores recientes |
| `GET /logs/stats/grouped` | Estadísticas agrupadas |
| `GET /logs/stats/summary` | Resumen general |
| `DELETE /logs/cleanup` | Eliminar logs antiguos |
| `POST /logs/flush` | Forzar flush del buffer |

**Configuración por ambiente:**

```env
# development - Guarda todo
LOG_DB_LEVEL=all

# staging - Solo warnings y errors (4xx, 5xx)
LOG_DB_LEVEL=warnings

# production - Solo errores críticos (5xx)
LOG_DB_LEVEL=errors

# test - No guarda nada
LOG_DB_LEVEL=none
```

### ✅ User Module (`/users`)

Gestión completa de usuarios con roles y permisos.

**Entidades:**
- `UserEntity` - Usuario con estado, verificación, bloqueo
- `RoleEntity` - Roles con jerarquía
- `PermissionEntity` - Permisos por módulo/acción

| Endpoint | Descripción | Roles |
|----------|-------------|-------|
| `POST /users` | Crear usuario | Admin, Manager |
| `GET /users` | Listar usuarios | Admin, Manager |
| `GET /users/stats` | Estadísticas | Admin |
| `GET /users/:id` | Obtener usuario | Admin, Manager |
| `PUT /users/:id` | Actualizar usuario | Admin, Manager |
| `DELETE /users/:id` | Eliminar (soft) | Admin |
| `POST /users/:id/restore` | Restaurar | Admin |
| `PATCH /users/:id/activate` | Activar | Admin, Manager |
| `PATCH /users/:id/deactivate` | Desactivar | Admin, Manager |
| `PATCH /users/:id/suspend` | Suspender | Admin |
| `PATCH /users/:id/block` | Bloquear | Admin |
| `GET /users/me/profile` | Mi perfil | * |
| `PATCH /users/me/profile` | Actualizar mi perfil | * |
| `POST /users/me/change-password` | Cambiar contraseña | * |

---

## 📦 Shared Modules

### RedisService

60+ métodos para operaciones Redis.

```typescript
// Inyección
constructor(private readonly redis: RedisService) {}

// Operaciones básicas
await this.redis.set('key', 'value', 3600);
const value = await this.redis.get('key');

// Cache helpers
const data = await this.redis.getOrSet('key', () => fetchData(), 3600);

// Listas, Sets, Hashes, Sorted Sets, Pub/Sub...
```

### RouterService

Cliente HTTP con retry, cache y paginación.

```typescript
// Inyección
constructor(private readonly router: RouterService) {}

// Peticiones simples
const data = await this.router.get<User>('https://api.example.com/users/1');

// Con retry automático
const data = await this.router.requestWithRetry({
  method: 'POST',
  url: 'https://api.example.com/orders',
  data: orderData,
});

// Con cache
const data = await this.router.getWithCache<Product[]>(
  'https://api.example.com/products',
  'products:all',
  3600
);
```

### UtilsService

Helpers unificados para strings, fechas, crypto, validaciones.

```typescript
// Inyección
constructor(private readonly utils: UtilsService) {}

// Strings
this.utils.slugify('Hello World'); // 'hello-world'
this.utils.truncate('Long text...', 10); // 'Long te...'

// Fechas
this.utils.formatDate(new Date(), 'YYYY-MM-DD');
this.utils.addDays(new Date(), 7);

// Crypto
const hash = await this.utils.hashPassword('password');
const token = this.utils.generateToken(32);

// Validaciones
this.utils.isValidEmail('test@example.com'); // true
this.utils.isValidUUID('...'); // true/false
```

---

## 🔐 Variables de Entorno

```env
# Application
NODE_ENV=development
APP_PORT=3000
APP_DEBUG=true

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=mokka_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRES_IN=15m

# Logging (NEW)
LOG_DB_LEVEL=all          # all | warnings | errors | none
LOG_CONSOLE=true          # true | false
LOG_IGNORE_PATHS=/health,/favicon.ico
```

Ver `.env.example` para la lista completa.

---

## 📖 Documentación

| Documento | Descripción |
|-----------|-------------|
| [MASTER.md](./docs/MASTER.md) | Guía maestra de arquitectura |
| [CODE-PATTERNS.md](./docs/CODE-PATTERNS.md) | Patrones de código y templates |
| [API-STANDARDS.md](./docs/API-STANDARDS.md) | Estándares de API |
| [DATABASE-PATTERNS.md](./docs/DATABASE-PATTERNS.md) | Patrones de base de datos |
| [SECURITY-GUIDE.md](./docs/SECURITY-GUIDE.md) | Guía de seguridad |
| [PROGRESS.md](./docs/PROGRESS.md) | Estado de implementación |

---

## 📚 API Documentation

Swagger UI disponible en desarrollo:

```
http://localhost:3000/docs
```

---

## 🧪 Testing

```bash
# Unit tests
yarn test

# Watch mode
yarn test:watch

# Coverage
yarn test:cov

# E2E tests
yarn test:e2e
```

---

## 🚀 Deployment

### Docker (recomendado)

```bash
# Build
docker build -t mokka-backend .

# Run
docker run -p 3000:3000 --env-file .env.production mokka-backend
```

### Manual

```bash
# Build
yarn build

# Start
NODE_ENV=production node dist/main.js
```

---

## 📄 Licencia

Softlogy S.A.S - Uso interno

---

## 🤝 Contribución

1. Leer `docs/MASTER.md` antes de empezar
2. Seguir los patrones de `docs/CODE-PATTERNS.md`
3. Validar contra `docs/API-STANDARDS.md`
4. Crear tests para nuevo código
5. Actualizar documentación si es necesario

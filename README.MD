# 🚀 Mokka Backend API

NestJS Backend API - Production Ready

---

## 🚨 LECTURA OBLIGATORIA ANTES DE CODIFICAR

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ANTES DE ESCRIBIR CUALQUIER CÓDIGO:                                       │
│                                                                             │
│   1. docs/CODING-CHECKLIST.md → Checklist obligatorio paso a paso           │
│   2. docs/QUICK-REFERENCE.md  → Referencia rápida de patrones               │
│   3. docs/CODE-PATTERNS.md    → Templates para copiar                       │
│                                                                             │
│   REGLAS DE ORO (NUNCA VIOLAR):                                             │
│                                                                             │
│   ✅ Repository: SIEMPRE createQueryBuilder (previene SQL injection)        │
│   ✅ Service: SIEMPRE inyectar SanitizerService + HandleErrorService        │
│   ✅ Controller: NUNCA try-catch (AllExceptionsFilter lo maneja)            │
│   ✅ DTO: SIEMPRE validaciones @IsString, @IsEmail + @ApiProperty           │
│   ✅ Entity: SIEMPRE @Index, @DeleteDateColumn, timestamps                  │
│                                                                             │
│   ❌ CÓDIGO SIN SEGUIR ESTAS REGLAS SERÁ RECHAZADO                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Estado del Proyecto

| Fase | Descripción | Estado | Progreso |
|------|-------------|--------|----------|
| 1 | Configuración Base | ✅ Completo | 100% |
| 2 | Shared Modules | ✅ Completo | 100% |
| 3 | Feature Modules | ✅ Completo | 100% |
| 4 | Database & Seeds | ✅ Completo | 100% |
| 5 | Testing | ⏳ Pendiente | 10% |
| 6 | **Integración Global** | ✅ **Completo** | **100%** |

> **Última actualización:** Enero 2025 - Sesión 13 (TasksModule + Seeds)

---

## 📦 Módulos Implementados

| Módulo | Estado | Archivos | Descripción |
|--------|--------|----------|-------------|
| **AuthModule** | ✅ 100% | 26 | Login, JWT, Sesiones, Passwords |
| **UserModule** | ✅ 100% | 12 | CRUD usuarios, roles, permisos |
| **NotificationModule** | ✅ 93% | 30 | Email, SMS, Push (async queue) |
| **QueueModule** | ✅ 100% | 20 | Bull Queue genérico |
| **TasksModule** | ✅ 100% | 18 | Cron jobs, cleanup, backup |
| **LoggerModule** | ✅ 100% | 7 | Logs a BD, buffer, tracing |
| **HealthModule** | ✅ 100% | 4 | Health checks, metrics |
| **CacheModule** | ✅ 100% | 3 | Cache con tags, invalidación |

### Módulos Omitidos (Decisión de Diseño)

| Módulo | Razón |
|--------|-------|
| **EventsModule** | No necesario - Bull Queue ya maneja tareas asíncronas y side effects |

---

## 📚 Documentación (Por Orden de Lectura)

### Obligatorios Antes de Codificar

| # | Documento | Descripción |
|---|-----------|-------------|
| 1 | [CODING-CHECKLIST.md](docs/CODING-CHECKLIST.md) | ⚡ **Checklist obligatorio** para cada módulo |
| 2 | [QUICK-REFERENCE.md](docs/QUICK-REFERENCE.md) | ⚡ Referencia rápida de patrones |
| 3 | [CODE-PATTERNS.md](docs/CODE-PATTERNS.md) | Templates completos para copiar |

### Referencia por Módulo

| Documento | Cuándo Consultar |
|-----------|------------------|
| [MASTER.md](docs/MASTER.md) | Arquitectura general y reglas |
| [API-STANDARDS.md](docs/API-STANDARDS.md) | Formato de responses y errores |
| [DATABASE-PATTERNS.md](docs/DATABASE-PATTERNS.md) | Queries TypeORM y transacciones |
| [SECURITY-GUIDE.md](docs/SECURITY-GUIDE.md) | JWT, guards, autenticación |
| [QUEUE-MODULE.md](docs/QUEUE-MODULE.md) | Sistema de colas asíncronas |
| [NOTIFICATION-MODULE.md](docs/NOTIFICATION-MODULE.md) | Sistema de notificaciones multi-canal |
| [INTEGRATION-STATUS.md](docs/INTEGRATION-STATUS.md) | Qué componentes están activos |
| [PROGRESS.md](docs/PROGRESS.md) | Historial de desarrollo |

### Ejemplos Funcionales

| Archivo | Contenido |
|---------|-----------|
| [complete-crud.example.ts](docs/EXAMPLES/complete-crud.example.ts) | CRUD completo con todos los patrones |
| [complete-auth.example.ts](docs/EXAMPLES/complete-auth.example.ts) | Autenticación JWT completa |
| [complete-relations.example.ts](docs/EXAMPLES/complete-relations.example.ts) | Relaciones TypeORM |
| [complete-testing.example.ts](docs/EXAMPLES/complete-testing.example.ts) | Testing con Jest |

---

## 📋 Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **NestJS** | 11.x | Framework principal |
| **TypeScript** | 5.x | Lenguaje |
| **PostgreSQL** | 15+ | Base de datos |
| **TypeORM** | 0.3.x | ORM |
| **Redis** | 7+ | Cache + Sessions + Queue |
| **Bull** | 4.x | Job queues |
| **@nestjs/schedule** | 6.x | Cron jobs |
| **JWT** | - | Autenticación |
| **Winston** | 3.x | Logging |
| **Swagger** | 11.x | Documentación API |
| **Jest** | 29.x | Testing |

---

## 🛠️ Instalación Rápida

```bash
# Clonar e instalar
git clone <repository-url>
cd mokka-backend
yarn install

# Configurar
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar migraciones
yarn migration:run

# Ejecutar seeds (datos iniciales)
yarn seed

# Iniciar
yarn start:dev
```

---

## 🌱 Seeds de Base de Datos

El proyecto incluye seeds para poblar la BD con datos iniciales:

```bash
yarn seed
```

**Datos sembrados:**
- **30 permisos** (users, roles, logs, tasks, cache, queue, notifications, etc.)
- **6 roles** con jerarquía (super_admin, admin, system, manager, user, guest)
- **4 usuarios de prueba**

| Email | Password | Rol |
|-------|----------|-----|
| admin@mokka.app | Admin123! | super_admin |
| system@mokka.app | System123! | system |
| manager@mokka.app | Manager123! | manager |
| user@mokka.app | User123! | user |

---

## 🔧 Scripts Principales

| Script | Descripción |
|--------|-------------|
| `yarn start:dev` | Desarrollo con hot-reload |
| `yarn build` | Compilar producción |
| `yarn start:prod` | Iniciar producción |
| `yarn test` | Unit tests |
| `yarn test:e2e` | E2E tests |
| `yarn lint` | ESLint |
| `yarn migration:run` | Ejecutar migraciones |
| `yarn migration:generate` | Generar migración |
| `yarn seed` | Ejecutar seeds |

---

## 🏗️ Arquitectura - Flujo de Request

```
Request HTTP
    │
    ├── Middlewares: RequestId (UUIDv7) → Logger (HTTP log)
    │
    ├── Guards: Throttler → JwtAuth → Roles
    │           │            │         │
    │           │            │         └── 403 si no tiene rol
    │           │            └── 401 si no tiene token (@Public lo bypasea)
    │           └── 429 si excede rate limit
    │
    ├── Interceptors: Logging (BD) → Timeout (30s) → Cache (si @Cacheable)
    │
    ├── Pipes: ValidationPipe (DTOs)
    │
    ├── Controller (SIN try-catch)
    │       │
    │       └── Service (SanitizerService + HandleErrorService)
    │               │
    │               └── Repository (createQueryBuilder SIEMPRE)
    │
    ├── Success → { success: true, data, message }
    └── Error → AllExceptionsFilter → { success: false, code, message, ... }
```

---

## ⚙️ Componentes Globales Activos

| Componente | Tipo | Bypass |
|------------|------|--------|
| `RequestIdMiddleware` | Middleware | - |
| `LoggerMiddleware` | Middleware | - |
| `ThrottlerGuard` | Guard Global | - |
| `JwtAuthGuard` | Guard Global | `@Public()` |
| `RolesGuard` | Guard Global | Sin `@Roles()` |
| `LoggingInterceptor` | Interceptor Global | `LOG_IGNORE_PATHS` |
| `TimeoutInterceptor` | Interceptor Global | - |
| `AllExceptionsFilter` | Filter Global | - |

---

## ⏰ Tareas Programadas (TasksModule)

El sistema incluye 5 jobs programados:

| Job | Cron | Descripción |
|-----|------|-------------|
| **CleanupJob** | 3 AM diario | Elimina soft-deleted >30 días |
| **BackupJob** | 2 AM domingos | Backup de tablas críticas a JSON |
| **SessionCleanupJob** | Cada 15 min | Elimina sesiones expiradas |
| **LogCleanupJob** | 4 AM diario | Elimina logs debug >7 días |
| **CacheWarmupJob** | 6 AM diario | Precalienta cache con stats |

**Endpoints de gestión:** `GET/POST /tasks/*` (requiere rol ADMIN)

---

## 📁 Estructura del Proyecto

```
mokka-backend/
├── docs/                       # 📚 DOCUMENTACIÓN
│   ├── CODING-CHECKLIST.md     # ⚡ Checklist obligatorio
│   ├── QUICK-REFERENCE.md      # ⚡ Referencia rápida
│   ├── CODE-PATTERNS.md        # Templates
│   ├── MASTER.md               # Reglas
│   ├── API-STANDARDS.md        # Responses
│   ├── DATABASE-PATTERNS.md    # TypeORM
│   ├── SECURITY-GUIDE.md       # Auth
│   ├── QUEUE-MODULE.md         # Sistema de colas
│   ├── NOTIFICATION-MODULE.md  # Notificaciones
│   ├── INTEGRATION-STATUS.md   # Estado
│   ├── PROGRESS.md             # Historial
│   └── EXAMPLES/               # Ejemplos
│
├── src/
│   ├── config/                 # Configuraciones
│   ├── constants/              # ERROR_CODES, ROLES
│   ├── decorators/             # @Public, @Roles, @Cacheable
│   ├── filters/                # AllExceptionsFilter
│   ├── guards/                 # JWT, Roles
│   ├── interceptors/           # Logging, Timeout
│   ├── middleware/             # RequestId, Logger
│   ├── pipes/                  # Validation
│   ├── database/               # Migraciones y Seeds
│   │   ├── migrations/         # TypeORM migrations
│   │   └── seeds/              # Datos iniciales
│   ├── modules/                # Módulos de negocio
│   │   ├── auth/               # ✅ Autenticación JWT
│   │   ├── user/               # ✅ Gestión de usuarios
│   │   ├── cache/              # ✅ Cache inteligente
│   │   ├── queue/              # ✅ Colas asíncronas (Bull)
│   │   ├── notification/       # ✅ Notificaciones multi-canal
│   │   ├── tasks/              # ✅ Tareas programadas (Cron)
│   │   ├── logger/             # ✅ Logging a BD
│   │   └── health/             # ✅ Health checks
│   └── shared/                 # Módulos compartidos
│       ├── common/             # SanitizerService, HandleErrorService
│       ├── database/           # TransactionService
│       ├── redis/              # RedisService
│       ├── router/             # HTTP Client
│       └── utils/              # Helpers
│
└── test/                       # Tests
```

---

## ✅ Checklist Rápido Pre-Commit

```
[ ] Leí docs/CODING-CHECKLIST.md
[ ] Repository usa createQueryBuilder
[ ] Service inyecta SanitizerService + HandleErrorService
[ ] Controller NO tiene try-catch
[ ] DTOs tienen @ApiProperty + validadores
[ ] Entity tiene @Index + @DeleteDateColumn
[ ] Swagger decorators en endpoints
[ ] yarn lint pasa
```

---

## 🔐 Ejemplo de Endpoint Seguro

```typescript
// Controller - SIN try-catch
@Post()
@Roles(ROLES.ADMIN, ROLES.MANAGER)
@ApiOperation({ summary: 'Crear producto' })
@ApiResponse({ status: 201, description: 'Creado' })
async create(@Body() dto: CreateProductDto): Promise<IApiResponse<IProductResponse>> {
  const data = await this.productService.create(dto);
  return { success: true, message: 'Producto creado', data };
}

// Service - CON Shared Services
constructor(
  private readonly repository: ProductRepository,
  private readonly sanitizer: SanitizerService,      // ✅ OBLIGATORIO
  private readonly handleError: HandleErrorService,  // ✅ OBLIGATORIO
) {}

// Repository - SIEMPRE createQueryBuilder
async findById(id: string): Promise<Entity | null> {
  return await this.repo
    .createQueryBuilder('e')
    .where('e.id = :id', { id })  // ✅ Parámetro seguro
    .getOne();
}
```

---

## 📤 URLs de la API

| Ruta | Descripción |
|------|-------------|
| `GET /api/v1/health` | Health check (público) |
| `GET /docs` | Swagger UI |
| `GET /docs-json` | OpenAPI JSON |

---

## 👥 Equipo

**Backend Team** - Softlogy S.A.S

---

## 📝 Licencia

Softlogy Internal Use Only

---

> **⚠️ IMPORTANTE:** La documentación en `/docs` es OBLIGATORIA.
> Código que no siga los patrones establecidos será rechazado.

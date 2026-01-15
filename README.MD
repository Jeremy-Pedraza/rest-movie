# 🚀 REST-Valdez Backend API

NestJS Backend API - Production Ready with Multi-Tenant Architecture

---

## 🚨 LECTURA OBLIGATORIA ANTES DE CODIFICAR

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ANTES DE ESCRIBIR CUALQUIER CÓDIGO:                                       │
│                                                                             │
│   1. docs/MASTER.md            → Arquitectura y reglas fundamentales         │
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
│   ✅ Multi-Tenant: Extender BaseRepository y usar withSchema()              │
│                                                                             │
│   ❌ CÓDIGO SIN SEGUIR ESTAS REGLAS SERÁ RECHAZADO                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Estado del Proyecto

| Fase | Descripción             | Estado          | Progreso |
| ---- | ----------------------- | --------------- | -------- |
| 1    | Configuración Base      | ✅ Completo     | 100%     |
| 2    | Shared Modules          | ✅ Completo     | 100%     |
| 3    | Feature Modules         | ✅ Completo     | 100%     |
| 4    | Database & Seeds        | ✅ Completo     | 100%     |
| 5    | **Multi-Tenant System** | ✅ **Completo** | **100%** |
| 6    | Testing                 | ⏳ En Progreso  | 25%      |

> **Última actualización:** Enero 2025  
> **Estado:** Sistema Multi-Tenant Schema-per-Tenant Operativo

---

## 🏢 Sistema Multi-Tenant (Schema-per-Tenant)

### ¿Qué es?

El backend implementa **schema-per-tenant** de PostgreSQL para **aislamiento físico** de datos por empresa.

### Ventajas

| Ventaja                    | Descripción                                                   |
| -------------------------- | ------------------------------------------------------------- |
| **Aislamiento físico**     | Cada tenant tiene su propio schema PostgreSQL                 |
| **Seguridad máxima**       | Imposible acceder a datos de otro tenant (a nivel PostgreSQL) |
| **Performance**            | Índices optimizados por tenant                                |
| **Queries simples**        | Sin necesidad de WHERE companyId en cada query                |
| **Backups independientes** | Backup/restore por tenant                                     |

### Arquitectura

```
Request con JWT
    │
    ├── JwtAuthGuard (valida token → request.user)
    │
    ├── TenantGuard (extrae tenant → request.tenant)
    │   ├── TenantExtractorService.extractFromUser(userId)
    │   │   ├── Busca user con company en schema 'public'
    │   │   ├── Valida company.isActive = true
    │   │   ├── Valida company.schema en SecurityConfigService
    │   │   └── Retorna { schema, companyId, userId }
    │   └── request.tenant = { schema, companyId, userId }
    │
    ├── TenantInterceptor (inyecta en SchemaContext)
    │
    ├── Service → Repository (BaseRepository)
    │   └── withSchema(async () => {
    │       ├── SET search_path TO {tenant_schema}, public
    │       ├── SELECT * FROM products  ← En el schema del tenant
    │       └── SET search_path TO public
    │     })
    │
    └── Response → SOLO datos del tenant actual
```

### Uso Rápido

#### 1. Entity Tenant (SIN schema explícito)

```typescript
// ✅ CORRECTO
@Entity({ name: 'products' }) // Sin schema property
export class ProductEntity extends BaseEntity {
  @Column() name: string;
  @Column() price: number;
}
```

#### 2. Repository (Extiende BaseRepository)

```typescript
@Injectable()
export class ProductsRepository extends BaseRepository<ProductEntity> {
  constructor(
    @InjectRepository(ProductEntity) repository: Repository<ProductEntity>,
    schemaContext: SchemaContext,
  ) {
    super(repository, schemaContext);
  }

  async findAll(): Promise<ProductEntity[]> {
    return await this.withSchema(async () => {
      return await this.repository.find();
    });
  }
}
```

#### 3. Service (Usa repository normalmente)

```typescript
@Injectable()
export class ProductsService {
  constructor(
    private readonly repository: ProductsRepository,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
  ) {}

  async findAll(): Promise<ProductEntity[]> {
    // El schema se aplica automáticamente
    return await this.repository.findAll();
  }
}
```

**Documentación completa:** [docs/MULTI-TENANT.md](docs/MULTI-TENANT.md)

---

## 📚 Documentación (Por Orden de Lectura)

### ⚡ Obligatorios Antes de Codificar

| #   | Documento                                     | Descripción                                |
| --- | --------------------------------------------- | ------------------------------------------ |
| 1   | [MASTER.md](docs/MASTER.md)                   | **⚡ Arquitectura y reglas fundamentales** |
| 2   | [QUICK-REFERENCE.md](docs/QUICK-REFERENCE.md) | Referencia rápida de patrones              |
| 3   | [CODE-PATTERNS.md](docs/CODE-PATTERNS.md)     | Templates completos para copiar            |

### 📖 Referencia por Módulo

| Documento                                             | Cuándo Consultar                  |
| ----------------------------------------------------- | --------------------------------- |
| [API-STANDARDS.md](docs/API-STANDARDS.md)             | Formato de responses y errores    |
| [DATABASE-PATTERNS.md](docs/DATABASE-PATTERNS.md)     | Queries TypeORM y transacciones   |
| [SECURITY-GUIDE.md](docs/SECURITY-GUIDE.md)           | JWT, guards, autenticación        |
| [MULTI-TENANT.md](docs/MULTI-TENANT.md)               | **Sistema multi-tenant completo** |
| [QUEUE-MODULE.md](docs/QUEUE-MODULE.md)               | Sistema de colas asíncronas       |
| [NOTIFICATION-MODULE.md](docs/NOTIFICATION-MODULE.md) | Notificaciones multi-canal        |
| [INTEGRATION-STATUS.md](docs/INTEGRATION-STATUS.md)   | Componentes activos               |
| [PROGRESS.md](docs/PROGRESS.md)                       | Historial de desarrollo           |

### 🔧 Ejemplos Funcionales

| Archivo                                                                        | Contenido               |
| ------------------------------------------------------------------------------ | ----------------------- |
| [complete-crud.example.ts](docs/EXAMPLES/complete-crud.example.ts)             | CRUD completo           |
| [complete-auth.example.ts](docs/EXAMPLES/complete-auth.example.ts)             | Autenticación JWT       |
| [products.repository.example.ts](docs/EXAMPLES/products.repository.example.ts) | Repository multi-tenant |
| [products.service.example.ts](docs/EXAMPLES/products.service.example.ts)       | Service multi-tenant    |

---

## 📦 Módulos Implementados

| Módulo                 | Estado  | Descripción                                   |
| ---------------------- | ------- | --------------------------------------------- |
| **AuthModule**         | ✅ 100% | Autenticación JWT + Sesiones + Reset Password |
| **UserModule**         | ✅ 100% | CRUD usuarios + Roles + Permisos              |
| **CompanyModule**      | ✅ 100% | Gestión de tenants (multi-tenant)             |
| **QueueModule**        | ✅ 100% | Colas asíncronas (Bull) para emails/reportes  |
| **NotificationModule** | ✅ 93%  | Notificaciones multi-canal (Email/SMS/Push)   |
| **TasksModule**        | ✅ 100% | Tareas programadas (Cron) - 5 jobs            |
| **CacheModule**        | ✅ 100% | Cache con tags e invalidación                 |
| **LoggerModule**       | ✅ 100% | Logging a BD con buffer                       |
| **HealthModule**       | ✅ 100% | Health checks para Kubernetes                 |

---

## 📋 Stack Tecnológico

| Categoría     | Tecnología       | Versión      |
| ------------- | ---------------- | ------------ |
| Framework     | NestJS           | 11.x         |
| Lenguaje      | TypeScript       | 5.x          |
| Base de Datos | PostgreSQL       | 15+          |
| ORM           | TypeORM          | 0.3.x        |
| Cache/Queue   | Redis + ioredis  | 7+ / 5.x     |
| Queue System  | Bull             | 4.x          |
| Cron Jobs     | @nestjs/schedule | 6.x          |
| Auth          | JWT + Passport   | 11.x / 0.7.x |
| Validación    | class-validator  | 0.14.x       |
| Documentación | Swagger          | 11.x         |
| Logging       | Winston          | 3.x          |
| Testing       | Jest + Supertest | 29.x         |

---

## 🛠️ Instalación Rápida

```bash
# Clonar e instalar
git clone <repository-url>
cd rest-valdez
yarn install

# Configurar
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar migraciones
yarn migration:run

# Ejecutar seeds (30 permisos + 6 roles + 4 users + 4 companies)
yarn seed

# Iniciar
yarn start:dev
```

**URLs:**

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs
- Health: http://localhost:3000/api/v1/health

---

## 🌱 Seeds de Base de Datos

El proyecto incluye seeds completos:

```bash
yarn seed
```

### Datos Sembrados

| Tipo          | Cantidad | Descripción                                                  |
| ------------- | -------- | ------------------------------------------------------------ |
| **Permisos**  | 30       | users, roles, logs, tasks, cache, queue, notifications, etc. |
| **Roles**     | 6        | super_admin, admin, system, manager, user, guest             |
| **Usuarios**  | 4        | admin, system, manager, user (todos con password)            |
| **Companies** | 4        | Sistema público + 3 tenants demo                             |

### Usuarios de Prueba

| Email            | Password    | Rol         | Company          |
| ---------------- | ----------- | ----------- | ---------------- |
| admin@rest.app   | Admin123!   | super_admin | Sistema (public) |
| system@rest.app  | System123!  | system      | Sistema (public) |
| manager@rest.app | Manager123! | manager     | Sistema (public) |
| user@rest.app    | User123!    | user        | Sistema (public) |

### Companies Multi-Tenant

| Company                 | Schema                    | Subdomain         | Estado   |
| ----------------------- | ------------------------- | ----------------- | -------- |
| Sistema - Public Schema | `public`                  | `public`          | Activa   |
| Restaurante Valle Demo  | `restaurant_valle_schema` | `restaurant-demo` | Activa   |
| Cafetería Bogotá Demo   | `cafe_bogota_schema`      | `cafe-demo`       | Activa   |
| Tienda Cali Demo        | `tienda_cali_schema`      | `tienda-demo`     | Inactiva |

---

## 🔧 Scripts Principales

| Script                    | Descripción               |
| ------------------------- | ------------------------- |
| `yarn start:dev`          | Desarrollo con hot-reload |
| `yarn build`              | Compilar para producción  |
| `yarn start:prod`         | Iniciar producción        |
| `yarn test`               | Unit tests                |
| `yarn test:e2e`           | E2E tests                 |
| `yarn test:cov`           | Coverage                  |
| `yarn lint`               | ESLint                    |
| `yarn format`             | Prettier                  |
| `yarn migration:run`      | Ejecutar migraciones      |
| `yarn migration:generate` | Generar migración         |
| `yarn seed`               | Ejecutar seeds            |

---

## 🏗️ Arquitectura - Flujo de Request

```
HTTP Request
    │
    ├── Middlewares
    │   ├── RequestIdMiddleware (UUIDv7)
    │   └── LoggerMiddleware (HTTP log)
    │
    ├── Guards (APP_GUARD)
    │   ├── ThrottlerGuard (Rate limiting)
    │   ├── JwtAuthGuard (Auth JWT, bypass: @Public())
    │   ├── TenantGuard (Multi-tenant, bypass: @SkipTenant())
    │   └── RolesGuard (Autorización, bypass: sin @Roles())
    │
    ├── Interceptors (APP_INTERCEPTOR)
    │   ├── LoggingInterceptor (Log a BD)
    │   ├── TenantInterceptor (SchemaContext)
    │   └── TimeoutInterceptor (30s)
    │
    ├── Pipes
    │   └── ValidationPipe (DTOs con class-validator)
    │
    ├── Controller (SIN try-catch)
    │   └── Service (SanitizerService + HandleErrorService)
    │       └── Repository (BaseRepository.withSchema)
    │           └── SET search_path TO {tenant_schema}
    │
    ├── Success → { success: true, data, message }
    └── Error → AllExceptionsFilter → { success: false, code, message, ... }
```

---

## ⚙️ Componentes Globales Activos

| Componente            | Tipo               | Bypass             |
| --------------------- | ------------------ | ------------------ |
| `RequestIdMiddleware` | Middleware         | -                  |
| `LoggerMiddleware`    | Middleware         | -                  |
| `ThrottlerGuard`      | Guard Global       | -                  |
| `JwtAuthGuard`        | Guard Global       | `@Public()`        |
| `TenantGuard`         | Guard Global       | `@SkipTenant()`    |
| `RolesGuard`          | Guard Global       | Sin `@Roles()`     |
| `LoggingInterceptor`  | Interceptor Global | `LOG_IGNORE_PATHS` |
| `TenantInterceptor`   | Interceptor Global | -                  |
| `TimeoutInterceptor`  | Interceptor Global | -                  |
| `AllExceptionsFilter` | Filter Global      | -                  |

---

## ⏰ Tareas Programadas (TasksModule)

| Job                   | Cron          | Descripción                   |
| --------------------- | ------------- | ----------------------------- |
| **CleanupJob**        | 3 AM diario   | Elimina soft-deleted >30 días |
| **BackupJob**         | 2 AM domingos | Backup de tablas críticas     |
| **SessionCleanupJob** | Cada 15 min   | Elimina sesiones expiradas    |
| **LogCleanupJob**     | 4 AM diario   | Elimina logs debug >7 días    |
| **CacheWarmupJob**    | 6 AM diario   | Precalienta cache             |

**Endpoints:** `GET/POST /api/v1/tasks/*` (requiere rol ADMIN)

---

## 📁 Estructura del Proyecto

```
rest-valdez/
├── docs/                       # 📚 DOCUMENTACIÓN CENTRALIZADA
│   ├── MASTER.md               # ⭐ Arquitectura y reglas
│   ├── MULTI-TENANT.md         # ⭐ Sistema multi-tenant completo
│   ├── QUICK-REFERENCE.md      # Referencia rápida
│   ├── CODE-PATTERNS.md        # Templates
│   ├── API-STANDARDS.md        # Responses
│   ├── DATABASE-PATTERNS.md    # TypeORM
│   ├── SECURITY-GUIDE.md       # Auth
│   ├── QUEUE-MODULE.md         # Colas
│   ├── NOTIFICATION-MODULE.md  # Notificaciones
│   ├── INTEGRATION-STATUS.md   # Estado
│   ├── PROGRESS.md             # Historial
│   ├── CLEANUP-INSTRUCTIONS.md # Limpieza de docs
│   ├── EXAMPLES/               # Ejemplos completos
│   └── archive/                # Archivos históricos
│
├── src/
│   ├── config/
│   │   └── security/
│   │       └── security-whitelist.json  # ⚠️ Schemas permitidos
│   ├── constants/              # ERROR_CODES, ROLES
│   ├── decorators/             # @Public, @Roles, @SkipTenant
│   ├── filters/                # AllExceptionsFilter
│   ├── guards/                 # JWT, Roles, Tenant
│   ├── interceptors/           # Logging, Timeout, Tenant
│   ├── middleware/             # RequestId, Logger
│   ├── pipes/                  # Validation
│   ├── database/
│   │   ├── migrations/         # TypeORM migrations
│   │   └── seeds/              # Datos iniciales
│   ├── modules/                # Módulos de negocio
│   │   ├── auth/               # ✅ Autenticación
│   │   ├── user/               # ✅ Usuarios
│   │   ├── company/            # ✅ Tenants
│   │   ├── cache/              # ✅ Cache
│   │   ├── queue/              # ✅ Colas
│   │   ├── notification/       # ✅ Notificaciones
│   │   ├── tasks/              # ✅ Cron jobs
│   │   ├── logger/             # ✅ Logging
│   │   └── health/             # ✅ Health
│   └── shared/                 # Módulos compartidos
│       ├── common/             # SanitizerService, HandleErrorService
│       ├── database/           # BaseRepository, SchemaContext, TransactionService
│       ├── redis/              # RedisService
│       ├── router/             # HTTP Client
│       └── utils/              # Helpers
│
└── test/                       # Tests
```

---

## ✅ Checklist Rápido Pre-Commit

```
[ ] Leí docs/MASTER.md
[ ] Repository usa createQueryBuilder
[ ] Si es tenant: extends BaseRepository + withSchema()
[ ] Si es tenant: Entity SIN schema explícito
[ ] Si es public: Entity CON schema: 'public'
[ ] Service inyecta SanitizerService + HandleErrorService
[ ] Controller NO tiene try-catch
[ ] DTOs tienen @ApiProperty + validadores
[ ] Entity tiene @Index + @DeleteDateColumn
[ ] Swagger decorators en endpoints
[ ] Schema agregado a security-whitelist.json (si es nuevo)
[ ] yarn lint pasa
```

---

## 🔐 Ejemplo de Endpoint Multi-Tenant

```typescript
// 1. Entity (SIN schema explícito)
@Entity({ name: 'products' })
export class ProductEntity extends BaseEntity {
  @Column() name: string;
}

// 2. Repository (extends BaseRepository)
@Injectable()
export class ProductsRepository extends BaseRepository<ProductEntity> {
  async findAll(): Promise<ProductEntity[]> {
    return await this.withSchema(async () => {
      return await this.repository.find();
    });
  }
}

// 3. Service (transparente)
async findAll(): Promise<ProductEntity[]> {
  return await this.repository.findAll();
}

// 4. Controller (sin cambios)
@Get()
@Roles(ROLES.USER)
async findAll(): Promise<IApiResponse<ProductEntity[]>> {
  const data = await this.service.findAll();
  return { success: true, message: 'OK', data };
}
```

**Resultado:** Cada tenant ve SOLO sus datos. Aislamiento garantizado a nivel PostgreSQL.

---

## 📧 Contacto

**Backend Team** - Softlogy S.A.S

---

## 📝 Licencia

Softlogy Internal Use Only

---

> **⚠️ IMPORTANTE:**
>
> - Documentación en `/docs` es OBLIGATORIA
> - Sistema multi-tenant requiere schemas en whitelist
> - Código sin seguir patrones establecidos será rechazado
> - NUNCA olvidar `withSchema()` en repositories tenant

---

> **Última actualización:** Enero 2025
> **Estado:** Multi-Tenant Schema-per-Tenant Operativo + Documentación Consolidada

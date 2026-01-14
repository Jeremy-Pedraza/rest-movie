# 🚀 Mokka Backend API

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

| Fase | Descripción | Estado | Progreso |
|------|-------------|--------|----------|
| 1 | Configuración Base | ✅ Completo | 100% |
| 2 | Shared Modules | ✅ Completo | 100% |
| 3 | Feature Modules | ✅ Completo | 100% |
| 4 | Database & Seeds | ✅ Completo | 100% |
| 5 | **Multi-Tenant System** | ✅ **Completo** | **100%** |
| 6 | Testing | ⏳ Pendiente | 15% |
| 7 | **Integración Global** | ✅ **Completo** | **100%** |

> **Última actualización:** Enero 2025 - Multi-Tenant Schema-per-Tenant Implementado

---

## 🏢 Sistema Multi-Tenant (Schema-per-Tenant)

### Arquitectura

El backend implementa **schema-per-tenant** de PostgreSQL para aislamiento físico de datos por empresa.

```
Usuario Login → JWT → TenantGuard → TenantInterceptor → BaseRepository → SET search_path
                 ↓         ↓              ↓                    ↓
              request   request.tenant  SchemaContext      PostgreSQL Schema
               .user                   (AsyncLocalStorage)
```

**Componentes:**

| Componente | Función |
|------------|---------|
| **TenantGuard** | Extrae tenant desde `user.company` |
| **TenantInterceptor** | Inyecta tenant en `SchemaContext` |
| **SchemaContext** | Almacena contexto (AsyncLocalStorage) |
| **BaseRepository** | Ejecuta queries con `SET search_path` |
| **SecurityConfigService** | Valida schemas contra whitelist |

### Ventajas vs Alternativas

| Característica | Schema-per-Tenant | Single DB + companyId |
|----------------|-------------------|-----------------------|
| Aislamiento | **Físico** (PostgreSQL) | Lógico (WHERE clause) |
| Performance | **Excelente** (índices separados) | Buena (índices compartidos) |
| Seguridad | **Imposible data leakage** | Fácil olvidar WHERE |
| Queries | **Simples** (sin WHERE) | Complejas (+WHERE everywhere) |
| Backups | **Por tenant** | Global solamente |
| Migraciones | **Por tenant** | Global solamente |

### Configuración de Seguridad

**Archivo:** `src/config/security/security-whitelist.json`

```json
{
  "allowedDomains": [
    "localhost",
    "restaurant-demo.miapp.com",
    "cafe-demo.miapp.com"
  ],
  "allowedSchemas": [
    "public",
    "restaurant_valle_schema",
    "cafe_bogota_schema",
    "tienda_cali_schema"
  ],
  "config": {
    "maxSchemaLength": 63,
    "allowDynamicSchemas": false,
    "logUnauthorizedAttempts": true
  }
}
```

**⚠️ Todos los schemas deben estar en whitelist para ser accesibles.**

### Uso en Código

#### 1. Crear Entidad (SIN schema explícito)

```typescript
// ✅ CORRECTO - Entity tenant
@Entity({ name: 'products' })  // Sin schema property
export class ProductEntity extends BaseEntity {
  @Column() name: string;
  @Column() price: number;
}

// ✅ CORRECTO - Entity public
@Entity({ name: 'users', schema: 'public' })  // Con schema: 'public'
export class UserEntity extends BaseEntity {}
```

#### 2. Crear Repository (Extends BaseRepository)

```typescript
@Injectable()
export class ProductsRepository extends BaseRepository<ProductEntity> {
  constructor(
    @InjectRepository(ProductEntity) repository: Repository<ProductEntity>,
    schemaContext: SchemaContext,
  ) {
    super(repository, schemaContext);
  }

  // Query simple con aislamiento automático
  async findAll(): Promise<ProductEntity[]> {
    return await this.withSchema(async () => {
      return await this.repository.find();
    });
  }

  // Query compleja con query builder
  async searchByName(term: string): Promise<ProductEntity[]> {
    return await this.withSchema(async () => {
      return await this.repository
        .createQueryBuilder('product')
        .where('product.name ILIKE :term', { term: `%${term}%` })
        .getMany();
    });
  }

  // Transacción multi-tenant
  async createMany(products: Partial<ProductEntity>[]): Promise<ProductEntity[]> {
    return await this.withSchemaTransaction(async (manager) => {
      const created = [];
      for (const data of products) {
        const product = manager.create(ProductEntity, data);
        created.push(await manager.save(product));
      }
      return created;
    });
  }
}
```

#### 3. Usar en Service (Transparente)

```typescript
@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
  ) {}

  async findAll(): Promise<ProductEntity[]> {
    // El schema se aplica automáticamente desde SchemaContext
    // NO necesitas pasar tenant como parámetro
    return await this.productsRepository.findAll();
  }
}
```

### Flujo Completo

```
1. Request: GET /api/v1/products
   Headers: Authorization: Bearer <jwt-restaurant>

2. JwtAuthGuard
   → request.user = { id: 'user-1', email: 'admin@restaurant.com' }

3. TenantGuard
   → Busca user.company en schema public
   → user.company.schema = 'restaurant_valle_schema'
   → Valida schema en allowedSchemas ✅
   → request.tenant = { schema: 'restaurant_valle_schema', companyId: 'xxx', userId: 'user-1' }

4. TenantInterceptor
   → SchemaContext.run(request.tenant, () => handler())

5. ProductsRepository.findAll()
   → withSchema(async () => {
       → SET search_path TO restaurant_valle_schema, public
       → SELECT * FROM products
       → SET search_path TO public
     })

6. Response: SOLO productos de restaurant_valle_schema
```

### Companies Demo

El sistema incluye 4 companies de ejemplo:

| Company | Schema | Subdomain | Estado |
|---------|--------|-----------|--------|
| Public Schema | `public` | `public` | Activa |
| Restaurante Valle | `restaurant_valle_schema` | `restaurant-demo` | Activa |
| Cafetería Bogotá | `cafe_bogota_schema` | `cafe-demo` | Activa |
| Tienda Cali | `tienda_cali_schema` | `tienda-demo` | Inactiva |

### Documentación Multi-Tenant

| Documento | Contenido |
|-----------|-----------|
| `docs/MULTI-TENANT-FASE-1.md` | Infraestructura base |
| `docs/MULTI-TENANT-FASE-2.md` | TenantGuard y extractor |
| `docs/MULTI-TENANT-FASE-3.md` | TenantInterceptor y BaseRepository |
| `docs/MULTI-TENANT-FASE-4.md` | Integración en app.module |
| `docs/MULTI-TENANT-FASE-5.md` | Migraciones y testing |
| `docs/EXAMPLES/products.repository.example.ts` | Ejemplo completo |

### Reglas Importantes

| ✅ DO | ❌ DON'T |
|-------|----------|
| Extender `BaseRepository` para entities tenant | Olvidar usar `withSchema()` |
| Usar `withSchema()` para TODAS las queries | Agregar WHERE companyId manual |
| Entity tenant SIN `schema: 'xxx'` | Entity tenant CON schema explícito |
| Entity public CON `schema: 'public'` | Usar raw SQL sin parámetros |
| Validar schemas en whitelist | Permitir schemas dinámicos sin validar |

---

## 📦 Módulos Implementados

| Módulo | Estado | Archivos | Descripción |
|--------|--------|----------|-------------|
| **AuthModule** | ✅ 100% | 26 | Login, JWT, Sesiones, Passwords |
| **UserModule** | ✅ 100% | 12 | CRUD usuarios, roles, permisos |
| **CompanyModule** | ✅ 100% | 9 | Gestión de tenants/companies |
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
| 1 | [MASTER.md](docs/MASTER.md) | ⚡ **Arquitectura y reglas fundamentales** |
| 2 | [QUICK-REFERENCE.md](docs/QUICK-REFERENCE.md) | ⚡ Referencia rápida de patrones |
| 3 | [CODE-PATTERNS.md](docs/CODE-PATTERNS.md) | Templates completos para copiar |

### Referencia por Módulo

| Documento | Cuándo Consultar |
|-----------|------------------|
| [API-STANDARDS.md](docs/API-STANDARDS.md) | Formato de responses y errores |
| [DATABASE-PATTERNS.md](docs/DATABASE-PATTERNS.md) | Queries TypeORM y transacciones |
| [SECURITY-GUIDE.md](docs/SECURITY-GUIDE.md) | JWT, guards, autenticación |
| [QUEUE-MODULE.md](docs/QUEUE-MODULE.md) | Sistema de colas asíncronas |
| [NOTIFICATION-MODULE.md](docs/NOTIFICATION-MODULE.md) | Sistema de notificaciones multi-canal |
| [INTEGRATION-STATUS.md](docs/INTEGRATION-STATUS.md) | Qué componentes están activos |
| [PROGRESS.md](docs/PROGRESS.md) | Historial de desarrollo |

### Multi-Tenant

| Documento | Contenido |
|-----------|-----------|
| [MULTI-TENANT-FASE-1.md](docs/MULTI-TENANT-FASE-1.md) | Infraestructura base (CompanyEntity, SchemaContext) |
| [MULTI-TENANT-FASE-2.md](docs/MULTI-TENANT-FASE-2.md) | TenantGuard, TenantExtractor, @SkipTenant() |
| [MULTI-TENANT-FASE-3.md](docs/MULTI-TENANT-FASE-3.md) | TenantInterceptor, BaseRepository, withSchema() |
| [MULTI-TENANT-FASE-4.md](docs/MULTI-TENANT-FASE-4.md) | Integración en app.module.ts |
| [MULTI-TENANT-FASE-5.md](docs/MULTI-TENANT-FASE-5.md) | Migraciones, seeds, testing |

### Ejemplos Funcionales

| Archivo | Contenido |
|---------|-----------|
| [complete-crud.example.ts](docs/EXAMPLES/complete-crud.example.ts) | CRUD completo con todos los patrones |
| [complete-auth.example.ts](docs/EXAMPLES/complete-auth.example.ts) | Autenticación JWT completa |
| [complete-relations.example.ts](docs/EXAMPLES/complete-relations.example.ts) | Relaciones TypeORM |
| [complete-testing.example.ts](docs/EXAMPLES/complete-testing.example.ts) | Testing con Jest |
| [products.repository.example.ts](docs/EXAMPLES/products.repository.example.ts) | Repository multi-tenant completo |
| [products.service.example.ts](docs/EXAMPLES/products.service.example.ts) | Service multi-tenant completo |

---

## 📋 Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **NestJS** | 11.x | Framework principal |
| **TypeScript** | 5.x | Lenguaje |
| **PostgreSQL** | 15+ | Base de datos (multi-tenant schemas) |
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

# Ejecutar seeds (datos iniciales + companies)
yarn seed

# Verificar multi-tenant setup
yarn ts-node src/database/migrations/verify-multi-tenant.ts

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
- **4 companies** (multi-tenant)

| Email | Password | Rol | Company |
|-------|----------|-----|---------|
| admin@mokka.app | Admin123! | super_admin | Public |
| system@mokka.app | System123! | system | Public |
| manager@mokka.app | Manager123! | manager | Public |
| user@mokka.app | User123! | user | Public |

**Companies creadas:**
- Sistema - Public Schema (`public`)
- Restaurante Valle Demo (`restaurant_valle_schema`)
- Cafetería Bogotá Demo (`cafe_bogota_schema`)
- Tienda Cali Demo (`tienda_cali_schema` - Inactiva)

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
| `yarn ts-node src/database/migrations/verify-multi-tenant.ts` | Verificar setup multi-tenant |

---

## 🏗️ Arquitectura - Flujo de Request

```
Request HTTP
    │
    ├── Middlewares: RequestId (UUIDv7) → Logger (HTTP log)
    │
    ├── Guards: Throttler → JwtAuth → Tenant → Roles
    │           │            │         │        │
    │           │            │         │        └── 403 si no tiene rol
    │           │            │         └── request.tenant = { schema, companyId, userId }
    │           │            └── 401 si no tiene token (@Public lo bypasea)
    │           └── 429 si excede rate limit
    │
    ├── Interceptors: Logging (BD) → Tenant (SchemaContext) → Timeout (30s)
    │
    ├── Pipes: ValidationPipe (DTOs)
    │
    ├── Controller (SIN try-catch)
    │       │
    │       └── Service (SanitizerService + HandleErrorService)
    │               │
    │               └── Repository (BaseRepository.withSchema)
    │                       │
    │                       └── SET search_path TO {tenant_schema}
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
| `TenantGuard` | Guard Global | `@SkipTenant()` |
| `RolesGuard` | Guard Global | Sin `@Roles()` |
| `LoggingInterceptor` | Interceptor Global | `LOG_IGNORE_PATHS` |
| `TenantInterceptor` | Interceptor Global | - |
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
│   ├── MASTER.md               # Arquitectura y reglas
│   ├── QUICK-REFERENCE.md      # Referencia rápida
│   ├── CODE-PATTERNS.md        # Templates
│   ├── API-STANDARDS.md        # Responses
│   ├── DATABASE-PATTERNS.md    # TypeORM
│   ├── SECURITY-GUIDE.md       # Auth
│   ├── QUEUE-MODULE.md         # Sistema de colas
│   ├── NOTIFICATION-MODULE.md  # Notificaciones
│   ├── MULTI-TENANT-*.md       # Multi-Tenant (5 docs)
│   ├── INTEGRATION-STATUS.md   # Estado
│   ├── PROGRESS.md             # Historial
│   └── EXAMPLES/               # Ejemplos
│
├── src/
│   ├── config/                 # Configuraciones
│   │   └── security/
│   │       └── security-whitelist.json  # ⚠️ Schemas permitidos
│   ├── constants/              # ERROR_CODES, ROLES
│   ├── decorators/             # @Public, @Roles, @SkipTenant
│   ├── filters/                # AllExceptionsFilter
│   ├── guards/                 # JWT, Roles, Tenant
│   ├── interceptors/           # Logging, Timeout, Tenant
│   ├── middleware/             # RequestId, Logger
│   ├── pipes/                  # Validation
│   ├── database/               # Migraciones y Seeds
│   │   ├── migrations/         # TypeORM migrations
│   │   └── seeds/              # Datos iniciales + companies
│   ├── modules/                # Módulos de negocio
│   │   ├── auth/               # ✅ Autenticación JWT
│   │   ├── user/               # ✅ Gestión de usuarios
│   │   ├── company/            # ✅ Gestión de tenants
│   │   ├── cache/              # ✅ Cache inteligente
│   │   ├── queue/              # ✅ Colas asíncronas (Bull)
│   │   ├── notification/       # ✅ Notificaciones multi-canal
│   │   ├── tasks/              # ✅ Tareas programadas (Cron)
│   │   ├── logger/             # ✅ Logging a BD
│   │   └── health/             # ✅ Health checks
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
[ ] Si es entity tenant: extends BaseRepository + withSchema()
[ ] Si es entity tenant: NO tiene schema explícito en @Entity
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
// 1. Entity (SIN schema explícito para tenant)
@Entity({ name: 'products' })
export class ProductEntity extends BaseEntity {
  @Column() name: string;
  @Column() price: number;
}

// 2. Repository (extends BaseRepository)
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

// 3. Service (usa repository normalmente)
@Injectable()
export class ProductsService {
  constructor(
    private readonly repository: ProductsRepository,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
  ) {}

  async findAll(): Promise<ProductEntity[]> {
    return await this.repository.findAll();
    // Schema se aplica automáticamente
  }
}

// 4. Controller (sin cambios)
@Get()
@Roles(ROLES.USER)
async findAll(): Promise<IApiResponse<ProductEntity[]>> {
  const data = await this.service.findAll();
  return { success: true, message: 'Productos obtenidos', data };
}
```

**Resultado:** Cada tenant ve SOLO sus productos, aislamiento garantizado a nivel PostgreSQL.

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

> **⚠️ IMPORTANTE:** 
> - La documentación en `/docs` es OBLIGATORIA
> - El sistema multi-tenant requiere schemas en whitelist
> - Código que no siga los patrones establecidos será rechazado
> - NUNCA olvidar usar `withSchema()` en repositories tenant

# 🚀 REST-Valdez Backend API

NestJS Backend API - Production Ready with Multi-Tenant Architecture & Reports System

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

## 📊 Estado del Proyecto - Enero 2025

```
╔═══════════════════════════════════════════════════════════╗
║        ARQUITECTURA MULTI-TENANT - ESTADO ACTUAL         ║
╚═══════════════════════════════════════════════════════════╝

Progreso General:  ███████████████████░  92%
Última Sesión:     Sesión 17 (2025-01-17)
Estado:            ⚡ LISTO PARA TESTING
```

### Fases Completadas ✅

| Fase | Módulo/Sistema | Estado | Detalles |
|------|----------------|--------|----------|
| 1-5 | Configuración Base | ✅ 100% | Setup, Shared, Features, DB, Seeds |
| 6 | **CompanyModule** | ✅ 100% | CRUD completo, multi-tenant |
| 7 | **StoreModule** | ✅ 100% | CRUD completo, multi-tenant |
| 8 | **UserModule** | ✅ 100% | Modificaciones multi-tenant |
| 9 | **ReportsModule** | ✅ 100% | Sistema completo + Multi-tenant |
| 7.4 | **ReportsRepository** | ✅ 100% | **38 métodos adaptados** ⭐ |

### En Progreso ⏳

| Fase | Descripción | Estado | Próximo Paso |
|------|-------------|--------|-------------|
| 7.5 | Testing E2E | ⏳ 0% | Probar sistema completo |

> **Última actualización:** 2025-01-17 (Sesión 17)  
> **Estado:** Sistema de Reportes Multi-Nivel Completo + Multi-Tenant 92%  
> **Próximo:** Validación funcional y testing E2E

---

## 🎯 Sistema de Reportes Multi-Nivel (NUEVO)

### Arquitectura de Datos

```
Company (Compañía)
    │
    └── Store (Tienda/Sucursal)
            │
            └── Report (Reporte Diario)
                    │
                    ├── SalesByOrderType (Ventas por tipo de orden)
                    ├── PaymentMethod (Métodos de pago)
                    ├── DynamicDiscount (Descuentos)
                    ├── Adjustment (Ajustes)
                    └── EffectiveOrder (Órdenes individuales)
```

### Funcionalidades del ReportsModule

| Categoría | Funcionalidad | Descripción |
|-----------|---------------|-------------|
| **CRUD** | Reportes | Crear, leer, actualizar, eliminar reportes |
| **Consolidaciones** | Por tienda | Totales de una tienda en período |
| | Por compañía | Totales de todas las tiendas de una compañía |
| | Global | Totales de todas las compañías |
| **Comparaciones** | Entre tiendas | Comparar métricas de múltiples tiendas |
| | Entre períodos | Comparar período actual vs anterior |
| | Año vs Año (YoY) | Comparación interanual |
| | Mes vs Mes (MoM) | Comparación intermensual |
| | Por día de semana | Análisis de patrones semanales |
| **Rankings** | De tiendas | Top/Bottom por métrica seleccionada |
| | De compañías | Ranking global de compañías |
| **Estadísticas** | Globales | KPIs del sistema |
| | Tendencias | Series temporales para gráficos |

### Endpoints Principales

```
POST   /reports                    → Crear reporte
GET    /reports                    → Listar con filtros
GET    /reports/:id                → Obtener por ID
GET    /reports/:id/details        → Obtener con detalles completos
PUT    /reports/:id                → Actualizar
DELETE /reports/:id                → Eliminar

POST   /reports/consolidate        → Consolidar reportes
GET    /reports/consolidate/quick  → Consolidación rápida

POST   /reports/compare            → Comparar reportes
GET    /reports/compare/quick      → Comparación rápida

POST   /reports/ranking/stores     → Ranking de tiendas
POST   /reports/ranking/companies  → Ranking de compañías
GET    /reports/ranking/quick      → Ranking rápido (Top 3)

GET    /reports/stats/global       → Estadísticas globales
GET    /reports/trends             → Tendencias

GET    /reports/store/:storeId                → Reportes de una tienda
GET    /reports/company/:companyId            → Reportes de una compañía
GET    /reports/company/:companyId/dashboard  → Dashboard de compañía
```

### Control de Acceso por Rol

| Rol | Acceso |
|-----|--------|
| **SUPER_ADMIN / ADMIN** | Acceso completo a todo el sistema |
| **MANAGER** | Solo datos de su compañía |
| **USER** | Solo sus tiendas asignadas |

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

**Documentación completa:** [docs/MULTI-TENANT.md](docs/MULTI-TENANT.md)

---

## 🔄 Sistema de Cache por Tenant

### ¿Qué es?

El backend implementa cache HTTP inteligente con **RedisService** que soporta:
- ✅ Cache aislado por tenant (schema)
- ✅ Cache por usuario individual
- ✅ Cache público para endpoints sin auth
- ✅ Una sola conexión a Redis
- ✅ Keys unificadas con formato consistente

### Arquitectura

```
Request → @Cacheable() → CacheInterceptor
    │
    ├── Genera cache key según estrategia
    │   ├── public:     cache:http:{url}
    │   ├── per-tenant: cache:{schema}:http:{url}
    │   └── per-user:   cache:{schema}:user:{userId}:http:{url}
    │
    ├── RedisService.getJson(key)
    │   ├── HIT → Retorna datos cacheados
    │   └── MISS → Ejecuta handler
    │
    └── [Fire-and-forget] RedisService.setJson(key, data)
```

### Estrategias de Cache

| Estrategia | Cuándo Usar | Ejemplo |
|------------|-------------|---------||
| `public` | Endpoints sin auth (`@Public()`) | Health checks, stats públicas |
| `per-tenant` | Reportes/datos del tenant (DEFAULT) | Consolidaciones, dashboards |
| `per-user` | Datos altamente personalizados | Mis preferencias, mi dashboard |

### Uso Rápido

```typescript
// Cache por tenant (recomendado para reportes)
@Cacheable({ ttl: 120, strategy: 'per-tenant' })
@Get('reports/trends')
async getTrends() {
  return await this.service.getTrends();
}

// Cache por usuario (dashboards personalizados)
@Cacheable({ ttl: 60, strategy: 'per-user' })
@Get('my-dashboard')
async getMyDashboard(@CurrentUser() user: UserSessionDto) {
  return await this.service.getPersonalized(user.id);
}

// Cache público (sin autenticación)
@Public()
@Cacheable({ ttl: 3600, strategy: 'public' })
@Get('public-stats')
async getPublicStats() {
  return await this.service.getPublicStats();
}
```

### Guía de TTL Recomendados

| Tipo de Dato | TTL | Uso |
|--------------|-----|-----|
| Tiempo real | Sin cache | - |
| Dashboards | 60s (1 min) | Datos dinámicos |
| Reportes | 120-300s (2-5 min) | Balance rendimiento/actualización |
| Consolidaciones | 300s (5 min) | Queries pesados |
| Estadísticas públicas | 3600s (1 hora) | Datos estables |

**Documentación completa:** [docs/CACHE-PER-TENANT.md](docs/CACHE-PER-TENANT.md)

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
| [MULTI-TENANT.md](docs/MULTI-TENANT.md)               | Sistema multi-tenant completo     |
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

### Core Modules

| Módulo                 | Estado  | Descripción                                   |
| ---------------------- | ------- | --------------------------------------------- |
| **AuthModule**         | ✅ 100% | Autenticación JWT + Sesiones + Reset Password |
| **UserModule**         | ✅ 100% | CRUD usuarios + Roles + Permisos + Asignación tiendas |
| **CompanyModule**      | ✅ 100% | Gestión de tenants (multi-tenant)             |
| **StoreModule**        | ✅ 100% | Gestión de tiendas/sucursales                 |
| **ReportsModule**      | ✅ 100% | **Sistema de reportes multi-nivel**           |

### Infrastructure Modules

| Módulo                 | Estado  | Descripción                                   |
| ---------------------- | ------- | --------------------------------------------- |
| **QueueModule**        | ✅ 100% | Colas asíncronas (Bull) para emails/reportes  |
| **NotificationModule** | ✅ 93%  | Notificaciones multi-canal (Email/SMS/Push)   |
| **TasksModule**        | ✅ 100% | Tareas programadas (Cron) - 5 jobs            |
| **CacheModule**        | ✅ 100% | Cache con tags e invalidación                 |
| **CacheInterceptor**   | ✅ 100% | Cache HTTP por tenant en endpoints            |
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

# Ejecutar seeds (permisos + roles + users + companies)
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
    │       └── Repository (createQueryBuilder)
    │
    ├── Success → { success: true, data, message }
    └── Error → AllExceptionsFilter → { success: false, code, message, ... }
```

---

## ⚙️ Componentes Globales Activos

| Componente            | Tipo                  | Bypass             |
| --------------------- | --------------------- | ------------------ |
| `RequestIdMiddleware` | Middleware            | -                  |
| `LoggerMiddleware`    | Middleware            | -                  |
| `ThrottlerGuard`      | Guard Global          | -                  |
| `JwtAuthGuard`        | Guard Global          | `@Public()`        |
| `TenantGuard`         | Guard Global          | `@SkipTenant()`    |
| `RolesGuard`          | Guard Global          | Sin `@Roles()`     |
| `LoggingInterceptor`  | Interceptor Global    | `LOG_IGNORE_PATHS` |
| `TenantInterceptor`   | Interceptor Global    | -                  |
| `TimeoutInterceptor`  | Interceptor Global    | -                  |
| `CacheInterceptor`    | Interceptor Selectivo | `@Cacheable()`     |
| `AllExceptionsFilter` | Filter Global         | -                  |

---

## ⏰ Tareas Programadas (TasksModule)

| Job                   | Cron          | Descripción                   |
| --------------------- | ------------- | ----------------------------- |
| **CleanupJob**        | 3 AM diario   | Elimina soft-deleted >30 días |
| **BackupJob**         | 2 AM domingos | Backup de tablas críticas     |
| **SessionCleanupJob** | Cada 15 min   | Elimina sesiones expiradas    |
| **LogCleanupJob**     | 4 AM diario   | Elimina logs debug >7 días    |
| **CacheWarmupJob**    | 6 AM diario   | Precalienta cache             |

---

## 📁 Estructura del Proyecto

```
rest-valdez/
├── docs/                       # 📚 DOCUMENTACIÓN CENTRALIZADA
│   ├── MASTER.md               # ⭐ Arquitectura y reglas
│   ├── MULTI-TENANT.md         # ⭐ Sistema multi-tenant
│   ├── QUICK-REFERENCE.md      # Referencia rápida
│   ├── CODE-PATTERNS.md        # Templates
│   ├── API-STANDARDS.md        # Responses
│   ├── DATABASE-PATTERNS.md    # TypeORM
│   ├── SECURITY-GUIDE.md       # Auth
│   ├── QUEUE-MODULE.md         # Colas
│   ├── NOTIFICATION-MODULE.md  # Notificaciones
│   ├── INTEGRATION-STATUS.md   # Estado
│   └── EXAMPLES/               # Ejemplos completos
│
├── src/
│   ├── config/                 # Configuraciones
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
│   │
│   ├── modules/                # 📦 MÓDULOS DE NEGOCIO
│   │   ├── auth/               # ✅ Autenticación
│   │   ├── user/               # ✅ Usuarios + Asignación tiendas
│   │   ├── company/            # ✅ Compañías (Tenants)
│   │   ├── store/              # ✅ Tiendas/Sucursales
│   │   ├── reports/            # ✅ NUEVO - Sistema de Reportes
│   │   │   ├── dto/            # 12 archivos
│   │   │   ├── entities/       # 7 entidades
│   │   │   ├── enums/          # 3 enums
│   │   │   ├── guards/         # 2 guards
│   │   │   ├── interfaces/     # 5 interfaces
│   │   │   ├── reports.repository.ts
│   │   │   ├── reports.service.ts
│   │   │   ├── reports.controller.ts
│   │   │   └── reports.module.ts
│   │   ├── cache/              # ✅ Cache
│   │   ├── queue/              # ✅ Colas
│   │   ├── notification/       # ✅ Notificaciones
│   │   ├── tasks/              # ✅ Cron jobs
│   │   ├── logger/             # ✅ Logging
│   │   └── health/             # ✅ Health
│   │
│   └── shared/                 # Módulos compartidos
│       ├── common/             # SanitizerService, HandleErrorService
│       ├── database/           # BaseRepository, TransactionService
│       ├── redis/              # RedisService
│       ├── router/             # HTTP Client
│       └── utils/              # Helpers
│
└── test/                       # Tests
```

---

## ⚡ Multi-Tenant Quick Reference

> **🚨 REGLA CRÍTICA:** En repositorios multi-tenant, SIEMPRE recibir `manager` en el callback y usarlo.

### Patrón Correcto (OBLIGATORIO)

```typescript
// ✅ READ operations
async findById(id: string): Promise<Entity | null> {
  return this.withSchema(async (manager) => {
    //                           ↑ RECIBIR manager
    return await manager
      .getRepository(Entity)
      //     ↑ USAR manager.getRepository()
      .createQueryBuilder('entity')
      .where('entity.id = :id', { id })
      .getOne();
  });
}

// ✅ WRITE operations
async create(dto: CreateDto): Promise<Entity> {
  return this.withSchemaTransaction(async (manager) => {
    const entity = manager.create(Entity, dto);
    return await manager.save(Entity, entity);
  });
}
```

### Anti-Patrones PROHIBIDOS

```typescript
// ❌ NO recibir manager
this.withSchema(async () => { ... });

// ❌ Usar this.repository dentro de callback
this.withSchema(async (manager) => {
  return this.repository.find(); // ❌ MAL
});

// ❌ Usar repositorios secundarios directamente
this.withSchema(async (manager) => {
  return this.detailsRepo.find(); // ❌ MAL
});
```

### Tabla de Decisión

| Entidad | Schema | Método |
|---------|--------|--------|
| users, companies, stores | PUBLIC | `createStaticQueryBuilder()` |
| report_headers, sales, etc | TENANT | `withSchema(manager) + manager.getRepository()` |

> **Ver:** `docs/BASE-REPOSITORY.md` para documentación completa.

---

## ✅ Checklist Rápido Pre-Commit

```
[ ] Leí docs/MASTER.md
[ ] Repository usa createQueryBuilder
[ ] Si es tenant: extends BaseRepository + withSchema()
[ ] Si es tenant: Entity SIN schema explícito
[ ] Si es tenant: SIEMPRE recibir manager en callback
[ ] Si es tenant: SIEMPRE usar manager.getRepository(Entity)
[ ] Si es tenant: NUNCA usar this.repository dentro de callbacks
[ ] Si es public: Entity CON schema: 'public'
[ ] Service inyecta SanitizerService + HandleErrorService
[ ] Controller NO tiene try-catch
[ ] DTOs tienen @ApiProperty + validadores
[ ] Entity tiene @Index + @DeleteDateColumn
[ ] Swagger decorators en endpoints
[ ] yarn lint pasa
```

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

> **Última actualización:** Enero 2025 - Sesión 20 (Migración Multi-Tenant Queries)
> **Estado:** Sistema de Reportes Multi-Nivel + Multi-Tenant Operativo

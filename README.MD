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
| 3 | Feature Modules | 🔄 En progreso | 75% |
| 4 | Database & Seeds | 🔄 En progreso | 50% |
| 5 | Testing | ⏳ Pendiente | 10% |
| 6 | **Integración Global** | ✅ **Completo** | **100%** |

> **Última actualización:** Enero 2025 - Sesión 9

---

## 📚 Documentación (Por Orden de Lectura)

### Obligatorios Antes de Codificar

| # | Documento | Descripción |
|---|-----------|-------------|
| 1 | [CODING-CHECKLIST.md](docs/CODING-CHECKLIST.md) | ⚡ **Checklist obligatorio** para cada módulo |
| 2 | [QUICK-REFERENCE.md](docs/QUICK-REFERENCE.md) | ⚡ Referencia rápida de patrones |
| 3 | [CODE-PATTERNS.md](docs/CODE-PATTERNS.md) | Templates completos para copiar |

### Referencia

| Documento | Cuándo Consultar |
|-----------|------------------|
| [MASTER.md](docs/MASTER.md) | Arquitectura general y reglas |
| [API-STANDARDS.md](docs/API-STANDARDS.md) | Formato de responses y errores |
| [DATABASE-PATTERNS.md](docs/DATABASE-PATTERNS.md) | Queries TypeORM y transacciones |
| [SECURITY-GUIDE.md](docs/SECURITY-GUIDE.md) | JWT, guards, autenticación |
| [INTEGRATION-STATUS.md](docs/INTEGRATION-STATUS.md) | Qué componentes están activos |
| [PROGRESS.md](docs/PROGRESS.md) | Historial de desarrollo |
| [CAMBIOS-ARQUITECTURA.md](docs/CAMBIOS-ARQUITECTURA.md) | Cambios por sesión |

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
| **Redis** | 7+ | Cache + Sessions |
| **Bull** | 4.x | Job queues |
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

# Iniciar
yarn start:dev
```

---

## 🔧 Scripts Principales

| Script | Descripción |
|--------|-------------|
| `yarn start:dev` | Desarrollo con hot-reload |
| `yarn build` | Compilar producción |
| `yarn test` | Unit tests |
| `yarn test:e2e` | E2E tests |
| `yarn lint` | ESLint |
| `yarn migration:run` | Ejecutar migraciones |

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
│   ├── INTEGRATION-STATUS.md   # Estado
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
│   ├── modules/                # Módulos de negocio
│   │   ├── auth/
│   │   ├── user/
│   │   ├── logger/
│   │   └── health/
│   └── shared/                 # Módulos compartidos
│       ├── common/             # SanitizerService, HandleErrorService
│       ├── database/           # TransactionService
│       ├── redis/              # RedisService
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
@ApiResponse({ status: 401, description: 'No autorizado' })
@ApiResponse({ status: 403, description: 'Sin permisos' })
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

async create(dto: CreateProductDto): Promise<IProductResponse> {
  const sanitized = { ...dto, name: this.sanitizer.sanitizeString(dto.name) };
  
  if (await this.repository.existsBySku(dto.sku)) {
    this.handleError.conflict('SKU ya existe', 'sku');  // Lanza 409
  }
  
  const entity = await this.repository.create(sanitized);
  return this.toResponse(entity);
}

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

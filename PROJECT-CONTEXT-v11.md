# 🎯 CONTEXTO DEL PROYECTO - Mokka Backend

> **Versión:** Sesión 11 (Enero 2025)
> **Estado:** NotificationModule completado y documentado

Este es Mokka Backend, una API REST construida con NestJS + TypeScript + PostgreSQL + Redis.

---

## 📊 Stack Tecnológico Principal

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| NestJS | 11.x | Framework |
| TypeScript | 5.x | Lenguaje |
| PostgreSQL + TypeORM | 15+ / 0.3.x | Base de datos |
| Redis + ioredis | 7+ / 5.x | Cache |
| Bull | 4.x | Colas (Jobs asíncronos) |
| JWT + Passport | 11.x / 0.7.x | Autenticación |
| Winston | 3.x | Logging |
| Jest | 29.x | Testing |
| Nodemailer | - | Email (SMTP) |
| Twilio | - | SMS (opcional) |
| Firebase FCM | - | Push notifications (opcional) |

---

## 🏗️ ARQUITECTURA OBLIGATORIA

### Patrón en Capas (SIEMPRE seguir)

```
Request → Middlewares → Guards → Interceptors → Controller → Service → Repository → Response
                                                    ↓
                                          AllExceptionsFilter (errores)
```

### Estructura de un módulo completo

```
modules/[nombre]/
├── dto/                    # Validaciones (class-validator)
├── entities/               # TypeORM entities
├── interfaces/             # TypeScript interfaces
├── tests/                  # Unit/Integration/E2E tests
├── [nombre].module.ts      # Module definition
├── [nombre].controller.ts  # HTTP endpoints + Guards + Swagger
├── [nombre].service.ts     # Business logic + Shared Services
└── [nombre].repository.ts  # Database queries (createQueryBuilder)
```

---

## 📚 DOCUMENTACIÓN - LEER ANTES DE GENERAR CÓDIGO

**TODOS los archivos están en `/docs` y DEBEN consultarse primero:**

| Archivo | Contiene | Cuándo leer |
|---------|----------|-------------|
| `docs/MASTER.md` | Reglas arquitectura, nomenclatura, anti-patrones | **SIEMPRE primero** |
| `docs/CODE-PATTERNS.md` | Templates completos (CRUD, DTOs, Entities, etc) | Al crear módulos/endpoints |
| `docs/API-STANDARDS.md` | Formato responses, rutas, status codes, ERROR_CODES | Al crear controllers |
| `docs/DATABASE-PATTERNS.md` | Queries TypeORM, transacciones, relaciones | Al crear repositories |
| `docs/SECURITY-GUIDE.md` | Guards, JWT, validaciones, SQL injection | Al trabajar con auth/seguridad |
| `docs/INTEGRATION-STATUS.md` | Estado de integración de componentes | Para verificar qué está activo |
| `docs/NOTIFICATION-MODULE.md` | ⭐ Documentación completa del módulo de notificaciones | Al usar notificaciones |
| `docs/NOTIFICATION-INTEGRATION.md` | ⭐ Guía de integración del módulo de notificaciones | Al integrar notificaciones |
| `docs/EXAMPLES/` | Código funcional completo copy-paste | Como referencia siempre |

---

## 🔤 NOMENCLATURA OBLIGATORIA

| Tipo | Formato | ✅ Correcto | ❌ Incorrecto |
|------|---------|-------------|---------------|
| Archivos | kebab-case.tipo.ts | `user-profile.service.ts` | `UserProfile.service.ts` |
| Clases | PascalCase | `class UserService` | `class userService` |
| Variables | camelCase | `const userId` | `const user_id` |
| Constantes | UPPER_SNAKE_CASE | `const MAX_ATTEMPTS` | `const maxAttempts` |
| Interfaces | IPascalCase | `interface IUser` | `interface user` |
| DTOs | PascalCase + Dto | `class CreateUserDto` | `class createUser` |

---

## ⚡ REGLAS CRÍTICAS - NUNCA VIOLAR

### 1. Validación SIEMPRE en DTOs

```typescript
// ✅ CORRECTO
export class CreateUserDto {
  @ApiProperty({ description: 'Email del usuario', example: 'user@example.com' })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;
}

// ❌ INCORRECTO - Sin validaciones
export class CreateUserDto {
  email: string;
}
```

### 2. Repository SIEMPRE con createQueryBuilder

```typescript
// ✅ CORRECTO - Previene SQL injection
async findById(id: string): Promise<UserEntity | null> {
  return await this.repo
    .createQueryBuilder('user')
    .where('user.id = :id', { id })  // Parámetro seguro
    .andWhere('user.deletedAt IS NULL')
    .getOne();
}

// ❌ INCORRECTO - SQL injection risk
async findById(id: string) {
  return await this.repo.query(`SELECT * FROM users WHERE id = '${id}'`);
}
```

### 3. Controller SIN try-catch (AllExceptionsFilter lo maneja)

```typescript
// ✅ CORRECTO - AllExceptionsFilter maneja errores globalmente
@Post()
@Roles(ROLES.ADMIN, ROLES.MANAGER)
@ApiOperation({ summary: 'Crear usuario' })
@ApiResponse({ status: 201, description: 'Usuario creado' })
@ApiResponse({ status: 400, description: 'Datos inválidos' })
async create(@Body() dto: CreateUserDto): Promise<IApiResponse<IUserResponse>> {
  const data = await this.service.create(dto);
  return {
    success: true,
    message: 'Usuario creado exitosamente',
    data,
  };
}

// ❌ INCORRECTO - try-catch innecesario (AllExceptionsFilter ya existe)
@Post()
async create(@Body() dto: CreateUserDto) {
  try {
    const data = await this.service.create(dto);
    return { success: true, data };
  } catch (error) {
    this.logger.error('Error', error);
    throw error;  // Redundante
  }
}
```

### 4. Service SIEMPRE con Shared Services

```typescript
// ✅ CORRECTO - Con SanitizerService y HandleErrorService
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly sanitizer: SanitizerService,      // ✅ OBLIGATORIO
    private readonly handleError: HandleErrorService,  // ✅ OBLIGATORIO
    private readonly transactionService: TransactionService, // ✅ DISPONIBLE
  ) {}

  async findById(id: string): Promise<IUserResponse> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      this.handleError.notFound('Usuario', id);  // ✅ Lanza 404 con ERROR_CODE
    }
    return this.toResponse(user);
  }
}

// ❌ INCORRECTO - Sin shared services
@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}
  
  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Not found');  // ❌ Sin ERROR_CODE
    }
    return user;
  }
}
```

### 5. NUNCA mezclar responsabilidades

```typescript
// ❌ INCORRECTO - Controller con lógica de negocio
@Get()
async findAll() {
  const users = await this.repo.find();
  return users.filter(u => u.active); // ❌ Lógica aquí NO
}

// ✅ CORRECTO - Controller delega al Service
@Get()
async findAll(@Query() query: QueryUserDto): Promise<IApiResponse<IPaginatedResponse<IUserResponse>>> {
  const result = await this.service.findAll(query);
  return {
    success: true,
    message: 'Usuarios obtenidos',
    data: result,
  };
}
```

---

## 📦 FORMATO DE RESPUESTAS ESTÁNDAR

> **Nota:** Controllers formatean manualmente (NO usamos `TransformInterceptor` global) para tener mensajes personalizados.

### Success Response

```typescript
interface IApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

// Ejemplo:
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John"
  }
}
```

### Error Response (Automático via AllExceptionsFilter)

```typescript
{
  "success": false,
  "statusCode": 404,
  "message": "Usuario con ID 'xxx' no encontrado",
  "error": "Not Found",
  "code": "RES_3001",           // ERROR_CODE del sistema
  "timestamp": "2025-01-12T15:30:00.000Z",
  "path": "/api/v1/users/xxx",
  "method": "GET",
  "requestId": "019abc12-3def-7890-abcd-ef1234567890"
}
```

### Paginación

```typescript
{
  "success": true,
  "message": "Usuarios obtenidos",
  "data": {
    "data": [ /* items */ ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

## 🔐 SEGURIDAD - CHECKLIST

- [ ] **DTOs con validaciones** (class-validator + mensajes personalizados)
- [ ] **@Roles() en controllers sensibles** (Guards globales activos)
- [ ] **createQueryBuilder en repositories** (NUNCA raw SQL)
- [ ] **SanitizerService en services** (sanitizar inputs)
- [ ] **HandleErrorService para errores** (ERROR_CODES consistentes)
- [ ] **Swagger decorators** (`@ApiOperation`, `@ApiTags`, `@ApiResponse`)

---

## ⚙️ COMPONENTES GLOBALES ACTIVOS

| Componente | Tipo | Propósito | Bypass |
|------------|------|-----------|--------|
| `RequestIdMiddleware` | Middleware | UUIDv7 para tracing | - |
| `LoggerMiddleware` | Middleware | Log HTTP entrada/salida | - |
| `ThrottlerGuard` | APP_GUARD | Rate limiting | - |
| `JwtAuthGuard` | APP_GUARD | Autenticación JWT | `@Public()` |
| `RolesGuard` | APP_GUARD | Autorización por roles | Sin `@Roles()` |
| `LoggingInterceptor` | APP_INTERCEPTOR | Log a BD | `LOG_IGNORE_PATHS` |
| `TimeoutInterceptor` | APP_INTERCEPTOR | Timeout 30s | - |
| `CacheInterceptor` | Selectivo | Cache responses | Solo con `@Cacheable()` |
| `AllExceptionsFilter` | APP_FILTER | Formato errores global | - |

---

## 📦 MÓDULOS DISPONIBLES

### ✅ Módulos Implementados

| Módulo | Estado | Propósito | Documentación |
|--------|--------|-----------|---------------|
| **AuthModule** | ✅ Completo | Autenticación y autorización | `src/modules/auth/README.md` |
| **UserModule** | ✅ Completo | Gestión de usuarios | - |
| **NotificationModule** | ✅ Operativo (93%) | Notificaciones multi-canal | `docs/NOTIFICATION-MODULE.md` |
| **HealthModule** | ✅ Completo | Health checks | - |
| **LoggerModule** | ✅ Completo | Logging a BD | - |

---

## 📧 NOTIFICATIONMODULE - USO RÁPIDO

### Cuándo usar

Siempre que necesites enviar:
- ✅ Emails (obligatorio configurar SMTP)
- ✅ SMS (opcional, con stub mode)
- ✅ Push notifications (opcional, con stub mode)
- ✅ Notificaciones multi-canal (email + SMS + push simultáneos)

### Cómo integrar

**1. Importar en tu módulo:**
```typescript
import { Module } from '@nestjs/common';
import { NotificationModule } from '@modules/notification';

@Module({
  imports: [NotificationModule], // ✅
})
export class MiModule {}
```

**2. Inyectar en tu service:**
```typescript
import { Injectable } from '@nestjs/common';
import { NotificationProducer } from '@modules/notification';

@Injectable()
export class MiService {
  constructor(
    private readonly notificationProducer: NotificationProducer, // ✅
  ) {}
}
```

**3. Usar (envío asíncrono - recomendado):**
```typescript
// Email de bienvenida
await this.notificationProducer.queueWelcomeEmail(
  user.email,
  {
    userName: user.firstName,
    userEmail: user.email,
    activationUrl: `${process.env.APP_URL}/activate/${token}`,
  },
);

// Reset de contraseña (urgente)
await this.notificationProducer.queueResetPasswordEmail(
  user.email,
  {
    userName: user.firstName,
    resetUrl: `${process.env.APP_URL}/reset/${token}`,
    expirationHours: 1,
  },
);

// Notificación genérica
await this.notificationProducer.queueNotificationEmail(
  user.email,
  {
    title: 'Perfil Actualizado',
    message: 'Tu perfil ha sido actualizado exitosamente.',
    type: NotificationEmailType.SUCCESS,
  },
);
```

### Variables de entorno requeridas

**Email (OBLIGATORIO):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-contraseña-app
SMTP_FROM="Mokka App" <noreply@mokka.com>
```

**SMS (OPCIONAL - usa stub si no está):**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567
```

**Push (OPCIONAL - usa stub si no está):**
```env
FIREBASE_PROJECT_ID=mi-proyecto
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@mi-proyecto.iam.gserviceaccount.com
```

**Redis (REQUERIDO para queue):**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Documentación completa

- **Referencia completa:** `docs/NOTIFICATION-MODULE.md`
- **Guía de integración:** `docs/NOTIFICATION-INTEGRATION.md`
- **Estado de integración:** `docs/INTEGRATION-STATUS.md` (sección NotificationModule)

---

## 🎯 WORKFLOW PARA GENERAR CÓDIGO

### Paso 1: Lee la documentación
```
Antes de generar CUALQUIER código, lee:
1. docs/MASTER.md (reglas generales)
2. docs/CODE-PATTERNS.md (patrón específico)
3. docs/INTEGRATION-STATUS.md (qué está activo)
4. Si usas notificaciones: docs/NOTIFICATION-INTEGRATION.md
```

### Paso 2: Sigue el patrón
```
Usa los templates de docs/CODE-PATTERNS.md como base.
NO inventes patrones nuevos.
```

### Paso 3: Valida contra las reglas
```
Verifica:
- ✅ Nomenclatura correcta
- ✅ Validaciones en DTOs con @ApiProperty
- ✅ createQueryBuilder en repositories
- ✅ SanitizerService + HandleErrorService en services
- ✅ SIN try-catch en controllers (AllExceptionsFilter activo)
- ✅ Swagger decorators completos
- ✅ @Roles() donde corresponde
- ✅ Si usas notificaciones: NotificationProducer inyectado
```

---

## 📋 COMANDOS ÚTILES

```bash
# Desarrollo
yarn start:dev           # Iniciar en modo desarrollo

# Testing
yarn test                # Run unit tests
yarn test:watch          # Run tests in watch mode
yarn test:cov            # Run tests with coverage
yarn test:e2e            # Run e2e tests

# Build
yarn build               # Build para producción
yarn start:prod          # Iniciar producción

# Database
yarn migration:run       # Ejecutar migraciones
yarn migration:generate  # Generar migración
yarn seed                # Ejecutar seeds

# Linting
yarn lint                # Lint código
yarn format              # Format código con Prettier
```

---

## 🚫 ANTI-PATRONES PROHIBIDOS

```typescript
// ❌ 1. try-catch en controller (AllExceptionsFilter lo maneja)
@Post()
async create(@Body() dto: CreateDto) {
  try {
    return await this.service.create(dto);
  } catch (error) {
    throw error; // Redundante
  }
}

// ❌ 2. Raw SQL en repository (SQL injection)
async findById(id: string) {
  return await this.repo.query(`SELECT * FROM users WHERE id = '${id}'`);
}

// ❌ 3. Controller con lógica de negocio
@Get()
async findAll() {
  const users = await this.repository.find();
  return users.filter(u => u.active);
}

// ❌ 4. Service sin shared services
@Injectable()
export class UserService {
  constructor(private readonly repository: UserRepository) {}
  // Falta SanitizerService, HandleErrorService
}

// ❌ 5. Excepciones sin ERROR_CODE
if (!user) {
  throw new NotFoundException('Not found');
}
// Correcto: this.handleError.notFound('Usuario', id);

// ❌ 6. DTO sin validaciones ni Swagger
export class CreateUserDto {
  email: string;
}

// ❌ 7. Usar NotificationService (síncrono) en lugar de NotificationProducer (asíncrono)
// Usar Producer (asíncrono) en 99% de casos
await this.notificationProducer.queueEmail(dto);
```

---

## ✅ CHECKLIST PRE-COMMIT

Antes de commitear código, verificar:

- [ ] Leí la documentación relevante en `/docs`
- [ ] Seguí la nomenclatura correcta (kebab-case archivos, PascalCase clases)
- [ ] DTOs tienen validaciones (class-validator) + @ApiProperty
- [ ] Controllers SIN try-catch (AllExceptionsFilter activo)
- [ ] Controllers retornan `IApiResponse<T>` con message personalizado
- [ ] Services inyectan SanitizerService + HandleErrorService
- [ ] Repositories usan createQueryBuilder (NUNCA raw SQL)
- [ ] Guards aplicados donde se necesitan (@Roles)
- [ ] Swagger decorators completos (@ApiTags, @ApiOperation, @ApiResponse)
- [ ] Si usas notificaciones: NotificationProducer inyectado y usado correctamente
- [ ] Tests creados (unit/integration/e2e)

---

## 🎓 PRINCIPIOS FUNDAMENTALES

1. **Lee docs/ PRIMERO** - No adivines, lee la documentación
2. **Sigue los patrones** - No inventes nuevos patrones
3. **Una responsabilidad por capa** - Controller ≠ Service ≠ Repository
4. **Seguridad primero** - Validar TODO, prevenir SQL injection, sanitizar inputs
5. **Errores consistentes** - Usar HandleErrorService con ERROR_CODES
6. **Tests obligatorios** - Todo código debe tener tests
7. **Notificaciones asíncronas** - Usar NotificationProducer (asíncrono) en lugar de NotificationService (síncrono)

---

## 🔗 REFERENCIAS RÁPIDAS

| Necesidad | Documento |
|-----------|-----------|
| Patrón CRUD completo | `docs/CODE-PATTERNS.md` |
| Relaciones TypeORM | `docs/DATABASE-PATTERNS.md` |
| Autenticación/Guards | `docs/SECURITY-GUIDE.md` |
| ERROR_CODES | `docs/API-STANDARDS.md` |
| Estado de integración | `docs/INTEGRATION-STATUS.md` |
| Ejemplos funcionales | `docs/EXAMPLES/` |
| **Notificaciones (email/SMS/push)** | `docs/NOTIFICATION-MODULE.md` |
| **Integrar notificaciones** | `docs/NOTIFICATION-INTEGRATION.md` |

---

## 🎯 RESUMEN EN 3 LÍNEAS

1. **Lee** `docs/MASTER.md` y `docs/CODE-PATTERNS.md` antes de generar código
2. **Sigue** el patrón: Controller (sin try-catch) → Service (con shared services) → Repository (createQueryBuilder)
3. **Valida** DTOs con class-validator, usa HandleErrorService para errores, sanitiza inputs
4. **Notificaciones** usa NotificationProducer (asíncrono), lee `docs/NOTIFICATION-INTEGRATION.md`

---

> **Última actualización:** Enero 2025 - Sesión 11 (NotificationModule Completado)
> **Mantener este archivo actualizado en cada sesión importante**

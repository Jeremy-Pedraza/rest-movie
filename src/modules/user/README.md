# 👤 User Module - Gestión de Usuarios

> **Estado:** ✅ OPERATIVO (100% completo)
> **Versión:** 2.0.0
> **Última actualización:** Enero 2025

---

## 📋 Índice

1. [Descripción](#-descripción)
2. [UserEntity](#-userentity)
3. [Estados de Usuario](#-estados-de-usuario)
4. [Endpoints](#-endpoints)
5. [Relaciones](#-relaciones)
6. [Permisos](#-permisos)
7. [Ejemplos de Uso](#-ejemplos-de-uso)
8. [Integración con AuthModule](#-integración-con-authmodule)

---

## 🎯 Descripción

El **UserModule** gestiona usuarios del sistema con soporte completo para:

- ✅ **CRUD completo** de usuarios
- ✅ **Gestión de estados** (activo, inactivo, suspendido, bloqueado)
- ✅ **Relación con companies** (multi-tenant)
- ✅ **Asignación a stores** (múltiples tiendas)
- ✅ **Gestión de roles** (RBAC)
- ✅ **Perfil de usuario** (endpoints /me/*)
- ✅ **Estadísticas** y reportes
- ✅ **Soft delete** (restauración)
- ✅ **Cache inteligente** (stats con 5min TTL)

---

## 📦 UserEntity

### Estructura de la Entity

```typescript
@Entity({ name: 'users', schema: 'public' })
export class UserEntity {
  // Identificación
  id: string;                        // UUID
  email: string;                     // Único
  password: string;                  // Hasheada (bcrypt)

  // Información personal
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar: string | null;

  // Estado
  status: UserStatus;                // active, inactive, pending, suspended, blocked
  email_verified: boolean;
  email_verified_at: Date | null;

  // Seguridad
  last_login_at: Date | null;
  last_login_ip: string | null;
  failed_login_attempts: number;
  locked_until: Date | null;
  password_reset_token: string | null;
  password_reset_expires: Date | null;

  // Preferencias
  preferences: Record<string, any> | null;
  locale: string;                    // es, en, etc.
  timezone: string;                  // America/Santo_Domingo, etc.

  // Multi-tenant
  company_id: string | null;         // FK a companies
  company: CompanyEntity;

  // Relaciones
  roles: RoleEntity[];               // ManyToMany
  stores: StoreEntity[];             // ManyToMany (asignación)

  // Auditoría
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
```

### Campos Importantes

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `email` | string | Email del usuario | Único, requerido |
| `password` | string | Contraseña hasheada | select: false |
| `status` | enum | Estado actual | active, inactive, pending, suspended, blocked |
| `company_id` | uuid | Company asignada (tenant) | Nullable (puede ser null) |
| `roles` | array | Roles del usuario | ManyToMany |
| `stores` | array | Tiendas asignadas | ManyToMany |
| `failed_login_attempts` | number | Intentos fallidos | Default: 0 |
| `locked_until` | date | Bloqueado hasta | Nullable |

---

## 📊 Estados de Usuario

```typescript
export enum UserStatus {
  ACTIVE = 'active',         // Usuario activo (puede acceder)
  INACTIVE = 'inactive',     // Usuario inactivo (no puede acceder)
  PENDING = 'pending',       // Pendiente de activación
  SUSPENDED = 'suspended',   // Suspendido temporalmente
  BLOCKED = 'blocked',       // Bloqueado permanentemente
}
```

### Transiciones de Estado

```
PENDING → ACTIVE    (activación)
ACTIVE → INACTIVE   (desactivación)
ACTIVE → SUSPENDED  (suspensión temporal)
ACTIVE → BLOCKED    (bloqueo permanente)
SUSPENDED → ACTIVE  (reactivación)
INACTIVE → ACTIVE   (reactivación)
```

**Nota:** BLOCKED es el estado más restrictivo. Solo SUPER_ADMIN puede desbloquear.

---

## 🔌 Endpoints

### CRUD Básico

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `POST` | `/users` | Crear usuario | ADMIN, MANAGER |
| `GET` | `/users` | Listar con filtros | ADMIN, MANAGER |
| `GET` | `/users/stats` | Estadísticas | ADMIN |
| `GET` | `/users/:id` | Obtener por ID | ADMIN, MANAGER |
| `PUT` | `/users/:id` | Actualizar | ADMIN, MANAGER |
| `DELETE` | `/users/:id` | Soft delete | ADMIN |
| `POST` | `/users/:id/restore` | Restaurar | ADMIN |

### Gestión de Estado

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `PATCH` | `/users/:id/activate` | Activar usuario | ADMIN, MANAGER |
| `PATCH` | `/users/:id/deactivate` | Desactivar usuario | ADMIN, MANAGER |
| `PATCH` | `/users/:id/suspend` | Suspender usuario | ADMIN |
| `PATCH` | `/users/:id/block` | Bloquear usuario | ADMIN |

### Perfil (Usuario Actual)

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `GET` | `/users/me/profile` | Mi perfil | Autenticado |
| `PATCH` | `/users/me/profile` | Actualizar mi perfil | Autenticado |
| `POST` | `/users/me/change-password` | Cambiar mi contraseña | Autenticado |

**Total:** 14 endpoints

---

## 🔗 Relaciones

### Con CompanyEntity (Multi-Tenant)

```typescript
// Usuario pertenece a UNA company
@ManyToOne(() => CompanyEntity)
@JoinColumn({ name: 'company_id' })
company: CompanyEntity;

// Usuario puede NO tener company (usa schema public)
company_id: string | null;
```

**Regla:** 
- Si `company_id != null` → Usuario usa schema de tenant
- Si `company_id == null` → Usuario usa schema public (SUPER_ADMIN)

### Con RoleEntity (RBAC)

```typescript
// Usuario tiene MÚLTIPLES roles
@ManyToMany(() => RoleEntity)
@JoinTable({
  name: 'user_roles',
  joinColumn: { name: 'user_id' },
  inverseJoinColumn: { name: 'role_id' },
})
roles: RoleEntity[];
```

**Roles disponibles:**
- `SUPER_ADMIN` - Acceso total
- `ADMIN` - Administrador de company
- `MANAGER` - Gerente de store
- `USER` - Usuario estándar

### Con StoreEntity (Asignación)

```typescript
// Usuario asignado a MÚLTIPLES stores
@ManyToMany(() => StoreEntity, store => store.users)
stores: StoreEntity[];
```

**Uso:**
- MANAGER asignado a stores específicas
- USER asignado a stores donde trabaja

---

## 🔐 Permisos

### Matriz de Permisos

| Acción | SUPER_ADMIN | ADMIN | MANAGER | USER |
|--------|-------------|-------|---------|------|
| Crear usuario | ✅ | ✅ | ✅ (solo su company) | ❌ |
| Listar usuarios | ✅ | ✅ | ✅ (solo su company) | ❌ |
| Ver usuario | ✅ | ✅ | ✅ (solo su company) | ❌ |
| Actualizar usuario | ✅ | ✅ | ✅ (solo su company) | ❌ |
| Eliminar usuario | ✅ | ✅ | ❌ | ❌ |
| Restaurar usuario | ✅ | ✅ | ❌ | ❌ |
| Activar/Desactivar | ✅ | ✅ | ✅ (solo su company) | ❌ |
| Suspender | ✅ | ✅ | ❌ | ❌ |
| Bloquear | ✅ | ✅ | ❌ | ❌ |
| Ver estadísticas | ✅ | ✅ | ❌ | ❌ |
| Ver mi perfil | ✅ | ✅ | ✅ | ✅ |
| Actualizar mi perfil | ✅ | ✅ | ✅ | ✅ |
| Cambiar mi contraseña | ✅ | ✅ | ✅ | ✅ |

---

## 💻 Ejemplos de Uso

### 1. Crear Usuario

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gerente@restaurant.com",
    "password": "Password123!",
    "first_name": "Juan",
    "last_name": "Pérez",
    "phone": "+1809555123",
    "company_id": "550e8400-e29b-41d4-a716-446655440000",
    "role_ids": ["role-manager-uuid"],
    "locale": "es",
    "timezone": "America/Santo_Domingo"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": "user-uuid",
    "email": "gerente@restaurant.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "status": "pending",
    "company_id": "550e8400-e29b-41d4-a716-446655440000",
    "roles": ["MANAGER"],
    "created_at": "2025-01-17T12:00:00.000Z"
  }
}
```

### 2. Listar Usuarios con Filtros

```bash
curl -X GET "http://localhost:3000/api/v1/users?page=1&limit=10&status=active&company_id=550e8400" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Usuarios obtenidos exitosamente",
  "data": {
    "data": [
      {
        "id": "user-1",
        "email": "user1@example.com",
        "first_name": "Usuario",
        "last_name": "Uno",
        "status": "active"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### 3. Activar Usuario

```bash
curl -X PATCH http://localhost:3000/api/v1/users/user-uuid/activate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario activado",
  "data": {
    "id": "user-uuid",
    "status": "active",
    "updated_at": "2025-01-17T12:05:00.000Z"
  }
}
```

### 4. Ver Mi Perfil

```bash
curl -X GET http://localhost:3000/api/v1/users/me/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Perfil obtenido",
  "data": {
    "id": "user-uuid",
    "email": "myuser@example.com",
    "first_name": "Mi",
    "last_name": "Usuario",
    "avatar": "https://...",
    "company": {
      "id": "company-uuid",
      "name": "Mi Company",
      "schema": "mi_company_schema"
    },
    "roles": ["MANAGER"],
    "stores": [
      { "id": "store-1", "name": "Store Central" }
    ],
    "preferences": {
      "theme": "dark",
      "language": "es"
    }
  }
}
```

### 5. Cambiar Mi Contraseña

```bash
curl -X POST http://localhost:3000/api/v1/users/me/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "OldPassword123!",
    "new_password": "NewPassword456!",
    "confirm_password": "NewPassword456!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente",
  "data": null
}
```

### 6. Obtener Estadísticas

```bash
curl -X GET http://localhost:3000/api/v1/users/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Estadísticas obtenidas",
  "data": {
    "total": 120,
    "active": 95,
    "inactive": 10,
    "pending": 8,
    "suspended": 5,
    "blocked": 2,
    "by_company": {
      "company-1": 50,
      "company-2": 40,
      "company-3": 30
    },
    "by_role": {
      "ADMIN": 10,
      "MANAGER": 30,
      "USER": 80
    }
  }
}
```

---

## 🔗 Integración con AuthModule

### Métodos Requeridos por AuthModule

El **AuthModule** depende de los siguientes métodos en **UserService**:

```typescript
// 1. Login - Buscar usuario con password
async findByEmailWithPassword(email: string): Promise<UserEntity | null>

// 2. Verificar email existe
async existsByEmail(email: string): Promise<boolean>

// 3. Incrementar intentos fallidos
async incrementFailedAttempts(userId: string): Promise<void>

// 4. Resetear intentos fallidos
async resetFailedAttempts(userId: string): Promise<void>

// 5. Actualizar último login
async updateLastLogin(userId: string, ip: string): Promise<void>

// 6. Cambiar contraseña
async updatePassword(userId: string, newPassword: string): Promise<void>

// 7. Reset password tokens
async savePasswordResetToken(userId: string, token: string, expires: Date): Promise<void>
async validatePasswordResetToken(token: string): Promise<UserEntity | null>
async invalidatePasswordResetToken(userId: string): Promise<void>
```

**Estado:** ✅ Todos implementados en UserService

---

## 🔒 Seguridad

### Hash de Contraseñas

```typescript
// Automático con @BeforeInsert y @BeforeUpdate
@BeforeInsert()
@BeforeUpdate()
async hashPassword() {
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
```

**Nunca** se expone la contraseña en responses (select: false).

### Bloqueo por Intentos Fallidos

```
3 intentos fallidos → Bloqueado 15 minutos
5 intentos fallidos → Bloqueado 1 hora
10 intentos fallidos → Bloqueado permanentemente (status: blocked)
```

### Validación de Email

Los usuarios creados inician en estado `pending` hasta verificar email.

---

## 📊 Cache

### Estadísticas (5 minutos TTL)

```typescript
// Implementado en UserService
@Cacheable(300, ['user-stats', 'users'])
async getStats(): Promise<IUserStatsResponse>
```

**Tags:** `['user-stats', 'users']`
**TTL:** 300 segundos (5 minutos)

**Invalidación automática al:**
- Crear usuario
- Actualizar usuario
- Eliminar usuario
- Cambiar estado

---

## 🎯 DTOs de Validación

### CreateUserDto

```typescript
{
  email: string;                // Email válido, único
  password: string;             // Min 8 chars, mayúscula, minúscula, número
  first_name: string;           // Min 2 chars
  last_name: string;            // Min 2 chars
  phone?: string;               // Formato válido
  company_id?: string;          // UUID válido
  role_ids?: string[];          // Array de UUIDs
  locale?: string;              // es, en, etc.
  timezone?: string;            // America/Santo_Domingo, etc.
}
```

### UpdateUserDto

```typescript
{
  email?: string;               // Email válido
  first_name?: string;          // Min 2 chars
  last_name?: string;           // Min 2 chars
  phone?: string;               // Formato válido
  avatar?: string;              // URL válida
  locale?: string;
  timezone?: string;
  preferences?: Record<string, any>;
}
```

### QueryUserDto

```typescript
{
  page?: number;                // Default: 1
  limit?: number;               // Default: 10, max: 100
  status?: UserStatus;          // active, inactive, etc.
  company_id?: string;          // UUID
  search?: string;              // Email, nombre, apellido
  role?: string;                // ADMIN, MANAGER, USER
}
```

---

## 🔧 Troubleshooting

### Problema 1: "Email ya existe"

**Error:**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "El valor de 'email' ya existe",
  "code": "RES_3002",
  "field": "email"
}
```

**Causa:** Email duplicado.

**Solución:** Usar otro email o restaurar usuario eliminado.

---

### Problema 2: Usuario no puede acceder

**Posibles causas:**
1. `status != 'active'` → Activar usuario
2. `company.is_active = false` → Activar company
3. `locked_until > NOW()` → Esperar o resetear intentos
4. `deleted_at != NULL` → Restaurar usuario

---

### Problema 3: No puede cambiar contraseña

**Error:** "Contraseña incorrecta"

**Causa:** La contraseña actual no coincide.

**Solución:** Verificar contraseña actual o usar "Forgot Password".

---

## 📝 Notas Importantes

1. ✅ **Password nunca se expone** en responses (select: false)
2. ✅ **Hash automático** con bcrypt en @BeforeInsert/@BeforeUpdate
3. ✅ **Soft delete** preserva historial
4. ✅ **Multi-tenant** via company_id
5. ✅ **RBAC** via roles ManyToMany
6. ✅ **Cache inteligente** en stats (5min TTL)
7. ✅ **Bloqueo automático** por intentos fallidos

---

## 🔗 Referencias

| Documento | Contenido |
|-----------|-----------|
| [AuthModule README](../auth/README.md) | Autenticación y sesiones |
| [CompanyModule README](../company/README.md) | Multi-tenant |
| [StoreModule README](../store/README.md) | Asignación a tiendas |
| [SECURITY-GUIDE.md](../../../docs/SECURITY-GUIDE.md) | Seguridad |

---

> **Estado:** ✅ OPERATIVO (100% completo)
> **Última actualización:** Enero 2025
> **Próxima revisión:** Al agregar nuevas funcionalidades

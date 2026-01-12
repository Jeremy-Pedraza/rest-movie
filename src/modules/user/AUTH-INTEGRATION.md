# 📝 User Module - Actualización para Integración con Auth

> **Última actualización:** Enero 2025 - Sesión 9
> **Estado:** ✅ Métodos agregados - Listo para integración con AuthModule

---

## ✅ Cambios Realizados

### UserRepository - 6 métodos nuevos

#### AUTH SPECIFIC METHODS
```typescript
// 1. Buscar usuario con password por ID
async findByIdWithPassword(id: string): Promise<UserEntity | null>

// 2. Buscar usuario con roles por ID
async findByIdWithRoles(id: string): Promise<UserEntity | null>

// 3. Resetear intentos fallidos de login
async resetFailedAttempts(id: string): Promise<void>

// 4. Guardar token de reset de contraseña
async savePasswordResetToken(id: string, token: string, expiresAt: Date): Promise<void>

// 5. Invalidar token de reset de contraseña
async invalidatePasswordResetToken(id: string): Promise<void>
```

**Nota:** El método `findByEmail(email, includePassword)` ya existía y acepta un segundo parámetro para incluir password.

---

### UserService - 10 métodos nuevos

#### Métodos de búsqueda con password/roles
```typescript
// 1. Buscar por email con password (para login)
async findByEmailWithPassword(email: string): Promise<UserEntity | null>

// 2. Buscar por ID con password (para cambio de contraseña en auth)
async findByIdWithPassword(id: string): Promise<UserEntity | null>

// 3. Buscar por ID con roles completos (para refresh token)
async findByIdWithRoles(id: string): Promise<UserEntity | null>
```

#### Métodos de validación
```typescript
// 4. Verificar si email existe
async existsByEmail(email: string): Promise<boolean>
```

#### Métodos de tracking de login
```typescript
// 5. Incrementar intentos fallidos
async incrementFailedAttempts(id: string): Promise<void>

// 6. Resetear intentos fallidos
async resetFailedAttempts(id: string): Promise<void>

// 7. Actualizar último login
async updateLastLogin(id: string, ip?: string): Promise<void>
```

#### Métodos de gestión de contraseña
```typescript
// 8. Actualizar contraseña (hashea automáticamente)
async updatePassword(id: string, newPassword: string): Promise<void>

// 9. Guardar token de reset (expira en 1 hora)
async savePasswordResetToken(id: string, token: string): Promise<void>

// 10. Invalidar token de reset
async invalidatePasswordResetToken(id: string): Promise<void>
```

---

## 🔐 Seguridad

### Métodos con advertencias de seguridad

Los siguientes métodos tienen advertencias `⚠️` en su documentación porque **NO deben usarse directamente desde controllers**:

- `findByEmailWithPassword()` - Solo para AuthService
- `findByIdWithPassword()` - Solo para AuthService
- `updatePassword()` - NO valida contraseña actual

### Buenas prácticas

✅ **Correcto:**
```typescript
// En AuthService
const user = await this.userService.findByEmailWithPassword(email);
if (user && await bcrypt.compare(password, user.password)) {
  // Login exitoso
}
```

❌ **Incorrecto:**
```typescript
// En UserController - NUNCA hacer esto
const user = await this.userService.findByEmailWithPassword(email);
return user; // Expone el password!
```

---

## 📊 Flujos Implementados

### Login (AuthService usa estos métodos)
```
1. findByEmailWithPassword(email)
2. Verificar password con bcrypt
3. resetFailedAttempts(userId)
4. updateLastLogin(userId, ip)
```

### Incremento de intentos fallidos
```
1. incrementFailedAttempts(userId)
   ├─ Incrementa contador
   ├─ Si >= MAX_ATTEMPTS: bloquea usuario
   └─ Guarda en BD
```

### Forgot password
```
1. findByEmail(email)
2. Generar JWT token
3. savePasswordResetToken(userId, token)
4. Enviar email (pendiente)
```

### Reset password
```
1. Verificar token JWT
2. updatePassword(userId, newPassword)
3. invalidatePasswordResetToken(userId)
```

---

## 🔄 Integración con AuthModule

Ahora que estos métodos existen, **AuthModule está listo para ser integrado**. AuthService ya los está usando:

```typescript
// auth.service.ts ya importa y usa:
import { UserService } from '@modules/user';

constructor(
  private readonly userService: UserService,
  // ...
) {}

// Y los usa así:
async login(dto: LoginDto) {
  const user = await this.userService.findByEmailWithPassword(email);
  // ...
  await this.userService.resetFailedAttempts(user.id);
  await this.userService.updateLastLogin(user.id);
}
```

---

## ✅ Checklist de Integración

- [x] Métodos agregados en UserRepository
- [x] Métodos agregados en UserService
- [x] Sanitización de inputs implementada
- [x] Logging implementado
- [x] Manejo de errores con HandleErrorService
- [ ] AuthModule registrado en app.module.ts (Paso 4)
- [ ] Configuración JWT actualizada (Paso 2)
- [ ] Migración de sessions creada (Paso 3)

---

## 📝 Próximos Pasos

1. ✅ **Paso 1 - Completado** - Métodos en UserService
2. ⏳ **Paso 2** - Actualizar configuración JWT
3. ⏳ **Paso 3** - Crear migración de sessions
4. ⏳ **Paso 4** - Registrar AuthModule en app.module.ts
5. ⏳ **Paso 5** - Probar endpoints de auth

---

## 🧪 Testing Pendiente

### Unit Tests a crear
- [ ] `user.service.spec.ts` - Probar nuevos métodos auth
- [ ] `user.repository.spec.ts` - Probar nuevos métodos auth

### Escenarios a probar
- [ ] `findByEmailWithPassword` retorna password
- [ ] `findByEmailWithPassword` sanitiza email
- [ ] `existsByEmail` encuentra emails existentes
- [ ] `incrementFailedAttempts` incrementa contador
- [ ] `updatePassword` hashea contraseña
- [ ] `savePasswordResetToken` guarda token con expiración
- [ ] `invalidatePasswordResetToken` limpia token

---

> **Nota:** Todos los métodos siguen el patrón establecido:
> - Sanitización con SanitizerService
> - Manejo de errores con HandleErrorService
> - Logging con Logger
> - createQueryBuilder en Repository (previene SQL injection)

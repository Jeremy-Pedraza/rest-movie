# 🔧 Solución - Error de Migración

> **Error resuelto:** "no existe la relación «users»"  
> **Solución:** Crear migraciones para todas las tablas en orden correcto

---

## ✅ Migraciones Creadas (4 archivos)

Se crearon 4 migraciones que deben ejecutarse en este orden:

| Orden | Timestamp | Archivo | Tabla(s) |
|-------|-----------|---------|----------|
| 1 | `1736709400000` | `CreateRolesAndPermissionsTables.ts` | roles, permissions, role_permissions |
| 2 | `1736709500000` | `CreateUsersTable.ts` | users |
| 3 | `1736709550000` | `CreateUserRolesTable.ts` | user_roles |
| 4 | `1736709600000` | `CreateSessionsTable.ts` | sessions |

**Orden de dependencias:**
```
roles/permissions → users → user_roles → sessions
```

---

## 🚀 Ejecutar Migraciones

### 1. Ver migraciones pendientes
```bash
npm run migration:show
```

**Salida esperada:**
```
[ ] CreateRolesAndPermissionsTables1736709400000
[ ] CreateUsersTable1736709500000
[ ] CreateUserRolesTable1736709550000
[ ] CreateSessionsTable1736709600000
```

### 2. Ejecutar todas las migraciones
```bash
npm run migration:run
```

**Salida esperada:**
```
query: CREATE TABLE "roles" ...
query: CREATE TABLE "permissions" ...
query: CREATE TABLE "role_permissions" ...
query: INSERT INTO roles ...
Migration CreateRolesAndPermissionsTables1736709400000 has been executed successfully.

query: CREATE TABLE "users" ...
Migration CreateUsersTable1736709500000 has been executed successfully.

query: CREATE TABLE "user_roles" ...
Migration CreateUserRolesTable1736709550000 has been executed successfully.

query: CREATE TABLE "sessions" ...
Migration CreateSessionsTable1736709600000 has been executed successfully.

✅ 4 migrations executed successfully
```

---

## 📊 Tablas Creadas

### 1. roles
- **Campos:** id, name, description, timestamps
- **Roles por defecto:** super_admin, admin, manager, user, guest

### 2. permissions
- **Campos:** id, name, description, resource, action, timestamps

### 3. role_permissions (intermedia)
- **Campos:** roleId, permissionId
- **FK:** roles, permissions

### 4. users
- **Campos:** 23 columnas incluyendo:
  - Básicos: email, password, firstName, lastName, phone, avatar
  - Seguridad: failedLoginAttempts, lockedUntil, passwordResetToken
  - Estado: status, emailVerified
  - Metadata: metadata (jsonb), preferences (jsonb)

### 5. user_roles (intermedia)
- **Campos:** userId, roleId
- **FK:** users, roles

### 6. sessions
- **Campos:** 16 columnas incluyendo:
  - Tokens: refreshToken, refreshTokenFamily
  - Info: userAgent, ipAddress, device, location
  - Control: isActive, isRevoked, expiresAt

---

## ✅ Verificación

### Después de ejecutar las migraciones:

```bash
# Conectarse a PostgreSQL
psql -U postgres -d mokka_db

# Ver todas las tablas
\dt

# Debería mostrar:
# roles
# permissions
# role_permissions
# users
# user_roles
# sessions
# migrations

# Ver roles insertados
SELECT * FROM roles;

# Salir
\q
```

---

## 🔄 Si Necesitas Empezar de Nuevo

### Revertir todas las migraciones:
```bash
npm run migration:revert
npm run migration:revert
npm run migration:revert
npm run migration:revert
```

### O eliminar la BD y recrearla:
```bash
# Conectarse a PostgreSQL
psql -U postgres

# Eliminar BD
DROP DATABASE mokka_db;

# Recrear BD
CREATE DATABASE mokka_db;

# Conectarse a la nueva BD
\c mokka_db

# Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Salir
\q

# Ejecutar migraciones de nuevo
npm run migration:run
```

---

## 📝 Próximos Pasos

Una vez que las migraciones se ejecuten exitosamente:

### ✅ Completado
- [x] Migración roles/permissions creada
- [x] Migración users creada  
- [x] Migración user_roles creada
- [x] Migración sessions creada
- [ ] **Ejecutar migraciones** ← **HACER AHORA**

### ⏳ Siguiente
- [ ] **Paso 4:** Registrar AuthModule en app.module.ts
- [ ] **Paso 5:** Probar endpoints de autenticación

---

## 🎯 Comando Final

```bash
# Ejecutar ESTE comando ahora:
npm run migration:run
```

Si hay algún error, muéstrame el mensaje completo.

---

> **Resumen:** Se crearon 4 migraciones en orden correcto para resolver el error de foreign key.

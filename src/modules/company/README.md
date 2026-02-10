# 🏢 Company Module - Multi-Tenant Architecture

> **Estado:** ✅ OPERATIVO (100% completo)
> **Versión:** 3.0.0 - FASE 7.2.C
> **Última actualización:** Enero 2025

---

## 📋 Índice

1. [Descripción](#-descripción)
2. [Arquitectura Multi-Tenant](#-arquitectura-multi-tenant)
3. [FASE 7.2.C - Creación Automática de Schema](#-fase-72c---creación-automática-de-schema)
4. [CompanyEntity](#-companyentity)
5. [Endpoints](#-endpoints)
6. [Flujo de Creación](#-flujo-de-creación)
7. [Permisos](#-permisos)
8. [Ejemplos de Uso](#-ejemplos-de-uso)
9. [Troubleshooting](#-troubleshooting)

---

## 🎯 Descripción

El **CompanyModule** gestiona empresas/tenants en una arquitectura multi-tenant con **schema-per-tenant**.

Cada compañía (`CompanyEntity`) tiene su propio schema de PostgreSQL, lo que proporciona **aislamiento físico completo** de datos entre diferentes clientes.

### Características Principales

- ✅ **CRUD completo** de compañías
- ✅ **Creación automática de schema** (FASE 7.2.C)
- ✅ **Aislamiento físico** de datos por tenant
- ✅ **Whitelist de seguridad** para schemas permitidos
- ✅ **Sincronización con template** de schema
- ✅ **Eliminación permanente** con schema
- ✅ **Activación/desactivación** de compañías
- ✅ **Estadísticas** y reportes

---

## 🏗️ Arquitectura Multi-Tenant

### Diagrama de Schemas

```
PostgreSQL Database
├── schema: public (Compartido)
│   ├── users           ← Usuarios globales
│   ├── companies       ← Compañías/Tenants
│   ├── stores          ← Tiendas
│   ├── roles           ← Roles del sistema
│   ├── sessions        ← Sesiones
│   └── logs            ← Logs del sistema
│
├── schema: template_tenant (Plantilla)
│   ├── report_headers
│   ├── sales_by_order_type
│   ├── payment_methods
│   ├── dynamic_discounts
│   ├── adjustments
│   └── effective_orders
│
├── schema: taco_bell_rd (Tenant A)
│   ├── report_headers  ← Reportes del tenant A
│   ├── sales_by_order_type
│   ├── payment_methods
│   └── ... (6 tablas clonadas)
│
└── schema: restaurant_valle_schema (Tenant B)
    ├── report_headers  ← Reportes del tenant B
    ├── sales_by_order_type
    ├── payment_methods
    └── ... (6 tablas clonadas)
```

### Ventajas de Schema-per-Tenant

| Ventaja | Descripción |
|---------|-------------|
| **Aislamiento físico** | Imposible acceder a datos de otro tenant |
| **Seguridad máxima** | Barrera física en PostgreSQL |
| **Performance** | Índices y queries optimizados por tenant |
| **Backups independientes** | Backup/restore por tenant |
| **Queries simples** | Sin necesidad de WHERE companyId |
| **Migración fácil** | Cada tenant puede tener versiones diferentes |

---

## 🚀 FASE 7.2.C - Creación Automática de Schema

### ¿Qué es FASE 7.2.C?

La **FASE 7.2.C** implementa la **creación automática de schemas de tenant** cuando se crea una nueva compañía.

### Proceso Automático

Cuando se crea una compañía con un `schema` definido:

```
1. Validar RUC, email, schema únicos
   ↓
2. Verificar que schema no exista en PostgreSQL
   ↓
3. Crear registro en public.companies
   ↓
4. Llamar a TenantSchemaService.createTenantSchema()
   ├── Crear schema en PostgreSQL
   ├── Crear tipo enum (report_type_enum)
   ├── Clonar 6 tablas desde template_tenant
   ├── Crear índices y constraints
   └── Registrar en tabla tenant_schemas
   ↓
5. Si falla → Rollback (eliminar company)
   ↓
6. Retornar company creada con schema activo
```

### Tablas Clonadas Automáticamente

Cuando se crea un schema tenant, se clonan automáticamente estas 6 tablas:

1. `report_headers` - Cabeceras de reportes
2. `sales_by_order_type` - Ventas por tipo de orden
3. `payment_methods` - Métodos de pago
4. `dynamic_discounts` - Descuentos dinámicos
5. `adjustments` - Ajustes
6. `effective_orders` - Órdenes efectivas

**Nota:** Solo se clona la estructura (DDL), NO los datos.

### Componentes Involucrados

| Componente | Responsabilidad |
|------------|-----------------|
| **CompanyService** | Coordina creación, valida duplicados |
| **CompanyRepository** | Queries a BD (existsBySchema, etc.) |
| **TenantSchemaService** | Crea schema + clona tablas |
| **SecurityConfigService** | Valida schema contra whitelist |
| **TenantSchemaEntity** | Registra estado del schema |

---

## 📦 CompanyEntity

### Estructura de la Entity

```typescript
@Entity({ name: 'companies', schema: 'public' })
export class CompanyEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // Nombre de la empresa

  @Column({ type: 'varchar', length: 63, unique: true })
  schema: string; // Schema de PostgreSQL (ÚNICO)

  @Column({ type: 'varchar', length: 100, unique: true })
  subdomain: string; // Subdominio (para routing)

  @Column({ type: 'varchar', length: 20, unique: true })
  ruc: string; // RUC/NIT único

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string; // Email único

  @Column({ type: 'varchar', length: 100 })
  pais: string; // País

  @Column({ type: 'varchar', length: 100 })
  ciudad: string; // Ciudad

  @Column({ type: 'varchar', length: 3 })
  country_code: string; // Código ISO (DO, MX, etc.)

  @Column({ type: 'varchar', length: 3 })
  currency_code: string; // Código moneda (DOP, MXN, etc.)

  @Column({ type: 'boolean', default: true })
  is_active: boolean; // Estado activo/inactivo

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any> | null; // Configuración adicional

  @OneToMany(() => UserEntity, (user) => user.company)
  users: UserEntity[];

  @OneToMany(() => StoreEntity, (store) => store.company)
  stores: StoreEntity[];
}
```

### Campos Importantes

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `schema` | string | **Schema de PostgreSQL** | Único, max 63 chars, lowercase, snake_case |
| `subdomain` | string | Subdominio para routing | Único |
| `ruc` | string | RUC/NIT de la empresa | Único, requerido |
| `email` | string | Email de contacto | Único, requerido |
| `is_active` | boolean | Estado de la compañía | true = activo, false = bloqueado |
| `country_code` | string | Código ISO país | DO, MX, US, etc. |
| `currency_code` | string | Código moneda | DOP, MXN, USD, etc. |

### Reglas de Negocio

1. ✅ `schema` debe ser único en toda la BD
2. ✅ `schema` no puede modificarse después de creado
3. ✅ `schema` debe estar en whitelist de seguridad
4. ✅ `schema` máximo 63 caracteres (límite PostgreSQL)
5. ✅ `ruc` y `email` deben ser únicos
6. ✅ Si `is_active = false`, los usuarios no pueden acceder
7. ✅ Al eliminar company (soft delete), el schema NO se elimina

---

## 🔌 Endpoints

### CRUD Básico

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `POST` | `/companies` | Crear compañía (con schema automático) | SUPER_ADMIN, ADMIN |
| `GET` | `/companies` | Listar con filtros y paginación | SUPER_ADMIN, ADMIN, MANAGER |
| `GET` | `/companies/stats` | Estadísticas globales | SUPER_ADMIN, ADMIN |
| `GET` | `/companies/active` | Solo compañías activas | SUPER_ADMIN, ADMIN |
| `GET` | `/companies/:id` | Obtener por ID | SUPER_ADMIN, ADMIN, MANAGER |
| `GET` | `/companies/:id/stores` | Con info de tiendas | SUPER_ADMIN, ADMIN, MANAGER |
| `PUT` | `/companies/:id` | Actualizar | SUPER_ADMIN, ADMIN |
| `DELETE` | `/companies/:id` | Soft delete | SUPER_ADMIN, ADMIN |
| `POST` | `/companies/:id/restore` | Restaurar eliminada | SUPER_ADMIN, ADMIN |
| `POST` | `/companies/:id/activate` | Activar | SUPER_ADMIN, ADMIN |
| `POST` | `/companies/:id/deactivate` | Desactivar | SUPER_ADMIN, ADMIN |

### Endpoints de Schema (FASE 7.2.C)

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `GET` | `/companies/:id/schema` | Info del schema (tablas, tamaño, estado) | SUPER_ADMIN, ADMIN |
| `POST` | `/companies/:id/schema/sync` | Sincronizar con template | SUPER_ADMIN |
| `DELETE` | `/companies/:id/permanent` | ⚠️ Eliminar company + schema | SUPER_ADMIN |

---

## 🔄 Flujo de Creación

### Flujo Completo

```typescript
// 1. Request
POST /api/v1/companies
{
  "name": "Taco Bell RD",
  "schema": "taco_bell_rd",          // ← Trigger creación automática
  "ruc": "101234567",
  "email": "admin@tacobell.do",
  "pais": "República Dominicana",
  "ciudad": "Santo Domingo",
  "country_code": "DO",
  "currency_code": "DOP"
}

// 2. CompanyService.create()
//    ├── Validar RUC único
//    ├── Validar email único
//    ├── Validar schema único
//    └── Verificar schema no existe en PostgreSQL

// 3. CompanyRepository.create()
//    └── INSERT INTO public.companies (...)

// 4. Si schema != 'public':
//    TenantSchemaService.createTenantSchema('taco_bell_rd', companyId)
//    ├── CREATE SCHEMA taco_bell_rd
//    ├── CREATE TYPE taco_bell_rd.report_type_enum
//    ├── CREATE TABLE taco_bell_rd.report_headers (...)
//    ├── CREATE TABLE taco_bell_rd.sales_by_order_type (...)
//    ├── ... (4 tablas más)
//    ├── CREATE INDEX ...
//    ├── ALTER TABLE ... ADD CONSTRAINT (foreign keys)
//    └── INSERT INTO public.tenant_schemas (status: 'active')

// 5. Response 201 Created
{
  "success": true,
  "message": "Compañía creada exitosamente con schema 'taco_bell_rd'",
  "data": {
    "id": "company-uuid",
    "name": "Taco Bell RD",
    "schema": "taco_bell_rd",
    "is_active": true,
    ...
  }
}
```

### Validaciones Automáticas

```
✅ RUC único
✅ Email único
✅ Schema único en tabla companies
✅ Schema no existe en PostgreSQL
✅ Schema en whitelist (security-whitelist.json)
✅ Schema <= 63 caracteres
✅ Schema formato válido (lowercase, snake_case)
✅ Template tenant existe
```

### Rollback Automático

Si **cualquier paso falla** después de crear la company:

1. Se elimina el registro de `public.companies`
2. Se elimina el schema de PostgreSQL (si se creó)
3. Se retorna error al cliente

**Esto garantiza atomicidad:** O se crea TODO o NO se crea NADA.

---

## 🔐 Permisos

### Por Rol

| Rol | Permisos |
|-----|----------|
| **SUPER_ADMIN** | Acceso completo + eliminar permanente + sincronizar schema |
| **ADMIN** | CRUD completo, activar/desactivar, ver stats |
| **MANAGER** | Solo lectura de su compañía |
| **USER** | Sin acceso a este módulo |

### Matriz de Permisos

| Acción | SUPER_ADMIN | ADMIN | MANAGER | USER |
|--------|-------------|-------|---------|------|
| Crear company | ✅ | ✅ | ❌ | ❌ |
| Listar companies | ✅ | ✅ | ✅ (solo su company) | ❌ |
| Ver company | ✅ | ✅ | ✅ (solo su company) | ❌ |
| Actualizar company | ✅ | ✅ | ❌ | ❌ |
| Soft delete | ✅ | ✅ | ❌ | ❌ |
| Hard delete + schema | ✅ | ❌ | ❌ | ❌ |
| Activar/Desactivar | ✅ | ✅ | ❌ | ❌ |
| Ver schema info | ✅ | ✅ | ❌ | ❌ |
| Sincronizar schema | ✅ | ❌ | ❌ | ❌ |

---

## 💻 Ejemplos de Uso

### 1. Crear Compañía con Schema

```bash
curl -X POST http://localhost:3000/api/v1/companies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Restaurante Valle",
    "schema": "restaurant_valle_schema",
    "ruc": "RUC12345678",
    "email": "info@restaurantevalle.com",
    "pais": "República Dominicana",
    "ciudad": "Santo Domingo",
    "country_code": "DO",
    "currency_code": "DOP"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Compañía creada exitosamente con schema 'restaurant_valle_schema'",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Restaurante Valle",
    "schema": "restaurant_valle_schema",
    "ruc": "RUC12345678",
    "email": "info@restaurantevalle.com",
    "is_active": true,
    "country_code": "DO",
    "currency_code": "DOP",
    "created_at": "2025-01-17T10:00:00.000Z"
  }
}
```

### 2. Crear Compañía sin Schema (usa 'public')

```bash
curl -X POST http://localhost:3000/api/v1/companies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Empresa Demo",
    "schema": "public",
    "ruc": "RUC99999999",
    "email": "demo@empresa.com",
    "pais": "República Dominicana",
    "ciudad": "Santiago",
    "country_code": "DO",
    "currency_code": "DOP"
  }'
```

**Nota:** Si `schema: "public"`, NO se crea schema de tenant. Se usan las tablas en schema public.

### 3. Obtener Información del Schema

```bash
curl -X GET http://localhost:3000/api/v1/companies/550e8400-e29b-41d4-a716-446655440000/schema \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Información del schema obtenida",
  "data": {
    "schema_name": "restaurant_valle_schema",
    "owner": "postgres",
    "tables_count": 6,
    "size_bytes": 245760,
    "size_pretty": "240 KB",
    "created_at": "2025-01-17T10:00:05.000Z",
    "status": "active"
  }
}
```

### 4. Sincronizar Schema con Template

```bash
curl -X POST http://localhost:3000/api/v1/companies/550e8400-e29b-41d4-a716-446655440000/schema/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Schema sincronizado",
  "data": {
    "success": true,
    "schema": "restaurant_valle_schema",
    "message": "Schema sincronizado",
    "tables_created": 0
  }
}
```

**Nota:** `tables_created: 0` significa que todas las tablas ya existían. Si se agregaron nuevas tablas al template, aquí se crearían.

### 5. Eliminar Compañía (soft delete)

```bash
curl -X DELETE http://localhost:3000/api/v1/companies/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:** `204 No Content`

**Nota:** El schema NO se elimina. Solo marca `deleted_at`.

### 6. Eliminar Compañía Permanentemente (con schema)

```bash
curl -X DELETE http://localhost:3000/api/v1/companies/550e8400-e29b-41d4-a716-446655440000/permanent \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:** `204 No Content`

**⚠️ ADVERTENCIA:** Esto elimina:
- Registro de company
- Schema de PostgreSQL
- Todas las tablas del schema
- Todos los datos contenidos

**Esta operación es IRREVERSIBLE.**

---

## 🔧 Troubleshooting

### Problema 1: "Schema ya registrado"

**Error:**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "El schema ya está registrado",
  "code": "RES_3002",
  "field": "schema"
}
```

**Causa:** Otra company ya usa ese schema.

**Solución:** Usar un nombre de schema diferente.

---

### Problema 2: "Schema ya existe en la base de datos"

**Error:**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "El schema 'xxx' ya existe en la base de datos",
  "code": "RES_3002",
  "field": "schema"
}
```

**Causa:** El schema existe en PostgreSQL (posiblemente de una eliminación anterior incompleta).

**Solución:**
```sql
-- Verificar schemas existentes
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name NOT IN ('public', 'pg_catalog', 'information_schema', 'pg_toast');

-- Eliminar schema si es necesario
DROP SCHEMA xxx CASCADE;
```

---

### Problema 3: "Schema no permitido"

**Error:**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Schema no permitido: xxx",
  "code": "SEC_1001"
}
```

**Causa:** El schema no está en `security-whitelist.json`.

**Solución:**
```json
// src/config/security/security-whitelist.json
{
  "allowedSchemas": [
    "public",
    "template_tenant",
    "restaurant_valle_schema",
    "xxx"  // ← Agregar aquí
  ]
}
```

**Reiniciar servidor después de agregar.**

---

### Problema 4: "Template no encontrado"

**Error:**
```
Schema template 'template_tenant' no existe. Ejecute la migración primero.
```

**Causa:** No se ha ejecutado la migración que crea `template_tenant`.

**Solución:**
```bash
yarn migration:run
```

---

### Problema 5: Creación falla pero company queda en BD

**Síntoma:** Error al crear schema, pero company existe en `public.companies`.

**Causa:** Rollback no funcionó correctamente.

**Solución:**
```sql
-- Eliminar company manualmente
DELETE FROM public.companies WHERE id = 'company-uuid';

-- Verificar que no existe schema
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'xxx';

-- Si existe, eliminarlo
DROP SCHEMA xxx CASCADE;
```

---

## 📊 Integración con Otros Módulos

### UserModule

```typescript
// Usuario pertenece a una company
user.company_id = 'company-uuid';
user.company = companyEntity;

// TenantGuard extrae schema desde user.company
const schema = user.company.schema; // 'restaurant_valle_schema'
```

### StoreModule

```typescript
// Tienda pertenece a una company
store.company_id = 'company-uuid';
store.company = companyEntity;

// Validación: Store solo puede ver datos de su company
```

### ReportsModule

```typescript
// Reportes se guardan EN el schema del tenant
// SET search_path TO restaurant_valle_schema
await reportsRepository.create({ ... });

// Los reportes quedan aislados por tenant
```

---

## 📝 Notas Importantes

1. ✅ **El campo `schema` NO se puede modificar** después de crear la company
2. ✅ **Soft delete NO elimina el schema** (preserva datos históricos)
3. ✅ **Hard delete SÍ elimina el schema** (operación irreversible)
4. ✅ **Sincronizar schema** solo crea tablas faltantes, NO modifica existentes
5. ✅ **Whitelist de seguridad** previene schemas no autorizados
6. ✅ **Template tenant** debe existir antes de crear schemas
7. ✅ **Schema máximo 63 caracteres** (límite PostgreSQL)
8. ✅ **Usar snake_case** para nombres de schema (ej: `taco_bell_rd`, no `tacoBellRd`)

---

## 🔗 Referencias

| Documento | Contenido |
|-----------|-----------|
| [MULTI-TENANT.md](../../../docs/MULTI-TENANT.md) | Arquitectura completa multi-tenant |
| [BASE-REPOSITORY.md](../../../docs/BASE-REPOSITORY.md) | Uso de BaseRepository |
| [CHECKPOINT-MULTITENANT.md](../../../docs/CHECKPOINT-MULTITENANT.md) | Estado de implementación |
| [SECURITY-GUIDE.md](../../../docs/SECURITY-GUIDE.md) | Seguridad y validaciones |

---

## ✅ Checklist de Integración

Al integrar CompanyModule en tu código:

- [ ] Agregar nuevo schema a `security-whitelist.json`
- [ ] Verificar que `template_tenant` existe
- [ ] Ejecutar migraciones si es necesario
- [ ] Asignar usuarios a la company creada
- [ ] Crear tiendas dentro de la company
- [ ] Verificar que queries aíslan por schema
- [ ] Probar soft delete (schema preservado)
- [ ] Probar hard delete (schema eliminado)

---

> **Estado:** ✅ OPERATIVO (FASE 7.2.C COMPLETADA)
> **Última actualización:** Enero 2025
> **Próxima revisión:** Al agregar nuevas funcionalidades

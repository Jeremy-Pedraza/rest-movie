# 🏪 Store Module - Gestión de Tiendas/Sucursales

> **Estado:** ✅ OPERATIVO (100% completo)
> **Versión:** 2.0.0
> **Última actualización:** Enero 2025

---

## 📋 Descripción

El **StoreModule** gestiona tiendas/sucursales con soporte multi-tenant:

- ✅ **CRUD completo** de tiendas
- ✅ **Relación con companies** (cada tienda pertenece a una company)
- ✅ **Asignación de usuarios** (managers y empleados)
- ✅ **Activación/desactivación** de tiendas
- ✅ **Estadísticas** por tienda
- ✅ **Reportes** asociados a tienda
- ✅ **Soft delete** con restauración

---

## 📦 StoreEntity

```typescript
@Entity({ name: 'stores', schema: 'public' })
export class StoreEntity {
  id: string;                        // UUID
  company_id: string;                // FK a companies (requerido)
  name: string;                      // Nombre de la tienda
  code: string;                      // Código único por company
  address: string | null;            // Dirección física
  city: string | null;               // Ciudad
  state: string | null;              // Estado/provincia
  country_code: string;              // DO, MX, US, etc.
  postal_code: string | null;        // Código postal
  phone: string | null;              // Teléfono
  email: string | null;              // Email de contacto
  currency_code: string;             // DOP, MXN, USD, etc.
  timezone: string;                  // America/Santo_Domingo
  is_active: boolean;                // Estado activo/inactivo
  settings: Record<string, any> | null; // Configuración específica

  // Relaciones
  company: CompanyEntity;            // ManyToOne
  users: UserEntity[];               // ManyToMany (asignados)

  // Auditoría
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
```

---

## 🔌 Endpoints

### CRUD Básico

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `POST` | `/stores` | Crear tienda | SUPER_ADMIN, ADMIN |
| `GET` | `/stores` | Listar con filtros | SUPER_ADMIN, ADMIN, MANAGER |
| `GET` | `/stores/stats` | Estadísticas | SUPER_ADMIN, ADMIN |
| `GET` | `/stores/active` | Tiendas activas | SUPER_ADMIN, ADMIN, MANAGER |
| `GET` | `/stores/:id` | Obtener por ID | SUPER_ADMIN, ADMIN, MANAGER |
| `GET` | `/stores/:id/with-users` | Con usuarios asignados | SUPER_ADMIN, ADMIN, MANAGER |
| `PUT` | `/stores/:id` | Actualizar | SUPER_ADMIN, ADMIN |
| `DELETE` | `/stores/:id` | Soft delete | SUPER_ADMIN, ADMIN |
| `POST` | `/stores/:id/restore` | Restaurar | SUPER_ADMIN, ADMIN |
| `POST` | `/stores/:id/activate` | Activar | SUPER_ADMIN, ADMIN |
| `POST` | `/stores/:id/deactivate` | Desactivar | SUPER_ADMIN, ADMIN |

### Asignación de Usuarios

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `POST` | `/stores/:id/assign-users` | Asignar usuarios | SUPER_ADMIN, ADMIN, MANAGER |
| `POST` | `/stores/:id/remove-users` | Remover usuarios | SUPER_ADMIN, ADMIN, MANAGER |

**Total:** 13 endpoints

---

## 🔗 Relaciones

### Con CompanyEntity (Obligatoria)

```typescript
// Tienda SIEMPRE pertenece a UNA company
@ManyToOne(() => CompanyEntity)
@JoinColumn({ name: 'company_id' })
company: CompanyEntity;
```

**Regla:** No puede haber tienda sin company.

### Con UserEntity (Asignación)

```typescript
// Tienda tiene MÚLTIPLES usuarios asignados
@ManyToMany(() => UserEntity, user => user.stores)
@JoinTable({ name: 'user_stores' })
users: UserEntity[];
```

**Uso:**
- Managers asignados a tiendas específicas
- Empleados asignados a sus lugares de trabajo

---

## 🔐 Permisos

| Acción | SUPER_ADMIN | ADMIN | MANAGER | USER |
|--------|-------------|-------|---------|------|
| Crear tienda | ✅ | ✅ | ❌ | ❌ |
| Listar tiendas | ✅ | ✅ | ✅ (solo su company) | ❌ |
| Ver tienda | ✅ | ✅ | ✅ (solo su company) | ❌ |
| Actualizar tienda | ✅ | ✅ | ❌ | ❌ |
| Eliminar tienda | ✅ | ✅ | ❌ | ❌ |
| Activar/Desactivar | ✅ | ✅ | ❌ | ❌ |
| Asignar usuarios | ✅ | ✅ | ✅ (solo su company) | ❌ |
| Ver estadísticas | ✅ | ✅ | ❌ | ❌ |

---

## 💻 Ejemplos de Uso

### 1. Crear Tienda

```bash
curl -X POST http://localhost:3000/api/v1/stores \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Tienda Centro",
    "code": "TC-001",
    "address": "Av. Principal #123",
    "city": "Santo Domingo",
    "country_code": "DO",
    "currency_code": "DOP",
    "timezone": "America/Santo_Domingo",
    "phone": "+1809555999",
    "email": "tiendacentro@restaurant.com"
  }'
```

### 2. Asignar Usuarios a Tienda

```bash
curl -X POST http://localhost:3000/api/v1/stores/store-uuid/assign-users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": [
      "user-1-uuid",
      "user-2-uuid",
      "user-3-uuid"
    ]
  }'
```

### 3. Obtener Tienda con Usuarios

```bash
curl -X GET http://localhost:3000/api/v1/stores/store-uuid/with-users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Tienda con usuarios obtenida exitosamente",
  "data": {
    "id": "store-uuid",
    "name": "Tienda Centro",
    "code": "TC-001",
    "company": {
      "id": "company-uuid",
      "name": "Restaurante Valle"
    },
    "users": [
      {
        "id": "user-1",
        "email": "manager1@restaurant.com",
        "first_name": "Juan",
        "roles": ["MANAGER"]
      },
      {
        "id": "user-2",
        "email": "empleado1@restaurant.com",
        "first_name": "María",
        "roles": ["USER"]
      }
    ],
    "users_count": 2,
    "is_active": true
  }
}
```

---

## 📊 Reglas de Negocio

1. ✅ **code** debe ser único dentro de la company
2. ✅ **company_id** es obligatorio (no puede haber tienda sin company)
3. ✅ Si company está inactiva, la tienda también se considera inactiva
4. ✅ Los reportes se asocian a tiendas (no directamente a companies)
5. ✅ Un usuario puede estar asignado a múltiples tiendas
6. ✅ Solo MANAGER y empleados asignados pueden ver reportes de la tienda

---

## 🔧 Integración con Módulos

### ReportsModule

```typescript
// Reportes se asocian a stores
@ManyToOne(() => StoreEntity)
@JoinColumn({ name: 'store_id' })
store: StoreEntity;
```

Los reportes diarios se crean POR TIENDA.

### UserModule

```typescript
// Usuarios asignados a stores
@ManyToMany(() => StoreEntity)
stores: StoreEntity[];
```

Managers y empleados ven solo datos de tiendas asignadas.

---

## 📝 DTOs

### CreateStoreDto

```typescript
{
  company_id: string;          // UUID requerido
  name: string;                // Min 3 chars
  code: string;                // Único por company
  address?: string;
  city?: string;
  country_code: string;        // DO, MX, US
  currency_code: string;       // DOP, MXN, USD
  timezone: string;            // America/Santo_Domingo
  phone?: string;
  email?: string;
}
```

### AssignUsersToStoreDto

```typescript
{
  user_ids: string[];          // Array de UUIDs
}
```

---

## 🔗 Referencias

| Documento | Contenido |
|-----------|-----------|
| [CompanyModule README](../company/README.md) | Multi-tenant |
| [UserModule README](../user/README.md) | Asignación de usuarios |
| [ReportsModule README](../reports/README.md) | Reportes por tienda |

---

> **Estado:** ✅ OPERATIVO (100% completo)
> **Última actualización:** Enero 2025

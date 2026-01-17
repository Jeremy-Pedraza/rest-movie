# 📊 Reports Module - Sistema de Reportes Multi-Nivel

> **Estado:** ✅ OPERATIVO (100% completo)
> **Versión:** 2.0.0 - FASE 15
> **Última actualización:** Enero 2025

---

## 📋 Descripción

El **ReportsModule** es un sistema completo de reportes multi-nivel y multi-tenant con:

- ✅ **6 entidades relacionadas** (1 header + 5 detalles)
- ✅ **21 endpoints** (CRUD, consolidaciones, comparaciones, rankings)
- ✅ **Multi-tenant** (schema-per-tenant)
- ✅ **Control de acceso** por rol (SUPER_ADMIN, ADMIN, MANAGER, USER)
- ✅ **Consolidaciones** (por tienda, compañía, global)
- ✅ **Comparaciones** (tiendas, períodos, YoY, MoM)
- ✅ **Rankings** (mejores tiendas, mejores compañías)
- ✅ **Estadísticas** y tendencias

---

## 🏗️ Arquitectura de Datos

```
ReportHeader (Cabecera del reporte)
    │
    ├── SalesByOrderType (Ventas por tipo: dine-in, take-out, delivery)
    ├── PaymentMethod (Métodos de pago: efectivo, tarjeta, transferencia)
    ├── DynamicDiscount (Descuentos aplicados)
    ├── Adjustment (Ajustes: devoluciones, correcciones)
    └── EffectiveOrder (Órdenes efectivas detalladas)
```

**Schema:** Todas las entidades viven en el **schema del tenant** (ej: `restaurant_valle_schema`).

---

## 📦 ReportHeader Entity

```typescript
@Entity({ name: 'report_headers' })  // Sin schema explícito (tenant)
export class ReportHeaderEntity {
  id: string;                          // UUID
  store_id: string;                    // FK a public.stores
  report_date: string;                 // YYYY-MM-DD
  report_type: ReportType;             // daily, weekly, monthly

  // Totales calculados
  total_sales: number;                 // Total de ventas
  total_revenue: number;               // Ingresos netos
  total_quantity: number;              // Cantidad de productos
  orders_count: number;                // Número de órdenes
  average_ticket: number;              // Ticket promedio
  total_discounts: number;             // Total descuentos
  total_adjustments: number;           // Total ajustes

  // Metadata
  metadata: Record<string, any> | null;
  status: ReportStatus;                // published, draft, archived

  // Relaciones (en mismo schema)
  salesByOrderType: SalesByOrderTypeEntity[];
  paymentMethods: PaymentMethodEntity[];
  dynamicDiscounts: DynamicDiscountEntity[];
  adjustments: AdjustmentEntity[];
  effectiveOrders: EffectiveOrderEntity[];

  // Relación cross-schema
  store: StoreEntity;                  // ManyToOne a public.stores

  created_at: Date;
  updated_at: Date;
}
```

**Constraint:** `UNIQUE (store_id, report_date)` - No duplicados por tienda/fecha.

---

## 🔌 Endpoints (21 total)

### CRUD Básico (7)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/reports` | Crear reporte |
| `GET` | `/reports` | Listar con filtros |
| `GET` | `/reports/:id` | Obtener por ID |
| `GET` | `/reports/:id/details` | Con detalles completos |
| `PUT` | `/reports/:id` | Actualizar |
| `DELETE` | `/reports/:id` | Eliminar |
| `POST` | `/reports/:id/restore` | Restaurar |

### Consolidaciones (2)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/reports/consolidate` | Consolidar por nivel (tienda/compañía/global) |
| `GET` | `/reports/consolidate/quick` | Consolidación rápida últimos 30 días |

### Comparaciones (2)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/reports/compare` | Comparar reportes (tiendas/períodos/YoY/MoM) |
| `GET` | `/reports/compare/quick` | Comparación rápida mes actual vs anterior |

### Rankings (3)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/reports/ranking/stores` | Ranking de tiendas |
| `POST` | `/reports/ranking/companies` | Ranking de compañías |
| `GET` | `/reports/ranking/quick` | Top 10 tiendas últimos 30 días |

### Estadísticas (2)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/reports/stats/global` | Estadísticas globales |
| `GET` | `/reports/trends` | Tendencias |

### Por Entidad (5)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/reports/store/:storeId` | Reportes de tienda |
| `GET` | `/reports/store/:storeId/dashboard` | Dashboard de tienda |
| `GET` | `/reports/company/:companyId` | Reportes de compañía |
| `GET` | `/reports/company/:companyId/dashboard` | Dashboard de compañía |
| `GET` | `/reports/date/:date` | Reportes por fecha |

---

## 🔐 Control de Acceso (ReportAccessGuard)

### Matriz de Permisos

| Rol | Acceso |
|-----|--------|
| **SUPER_ADMIN** | Todos los reportes de todas las companies |
| **ADMIN** | Solo reportes de su company |
| **MANAGER** | Solo reportes de sus tiendas asignadas |
| **USER** | Sin acceso (no implementado aún) |

### Validaciones Automáticas

```typescript
// En ReportAccessGuard
if (role === ROLES.ADMIN) {
  // Validar que report.store.company_id === user.company_id
}

if (role === ROLES.MANAGER) {
  // Validar que report.store_id está en user.stores[]
}
```

---

## 🎯 Funcionalidades Clave

### 1. Consolidaciones

```bash
# Consolidar por tienda (últimos 30 días)
POST /reports/consolidate
{
  "consolidation_level": "store",
  "store_id": "store-uuid",
  "start_date": "2025-01-01",
  "end_date": "2025-01-30"
}

# Consolidar por compañía (trimestre)
POST /reports/consolidate
{
  "consolidation_level": "company",
  "company_id": "company-uuid",
  "start_date": "2025-01-01",
  "end_date": "2025-03-31"
}

# Consolidación global
POST /reports/consolidate
{
  "consolidation_level": "global",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consolidación completada",
  "data": {
    "consolidation_level": "store",
    "period": { "start": "2025-01-01", "end": "2025-01-30" },
    "total_sales": 450000.00,
    "total_revenue": 435000.00,
    "orders_count": 1250,
    "average_ticket": 360.00,
    "total_discounts": 15000.00,
    "reports_included": 30,
    "stores_included": 1
  }
}
```

### 2. Comparaciones

```bash
# Comparar dos tiendas
POST /reports/compare
{
  "comparison_type": "stores",
  "store_ids": ["store-1", "store-2"],
  "start_date": "2025-01-01",
  "end_date": "2025-01-31"
}

# Year-over-Year
POST /reports/compare
{
  "comparison_type": "year_over_year",
  "store_id": "store-uuid",
  "current_start": "2025-01-01",
  "current_end": "2025-01-31",
  "previous_start": "2024-01-01",
  "previous_end": "2024-01-31"
}
```

### 3. Rankings

```bash
# Top 10 tiendas
POST /reports/ranking/stores
{
  "metric": "total_sales",        # total_sales, orders_count, average_ticket
  "order": "desc",
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "limit": 10
}
```

**Response:**
```json
{
  "data": {
    "ranking": [
      {
        "rank": 1,
        "store_id": "store-1",
        "store_name": "Tienda Centro",
        "total_sales": 120000.00,
        "change_percentage": 15.5
      },
      {
        "rank": 2,
        "store_id": "store-2",
        "store_name": "Tienda Norte",
        "total_sales": 98000.00,
        "change_percentage": -2.3
      }
    ]
  }
}
```

---

## 💻 Ejemplo Completo: Crear Reporte

```bash
curl -X POST http://localhost:3000/api/v1/reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "store-uuid",
    "report_date": "2025-01-17",
    "report_type": "daily",
    "total_sales": 15000.00,
    "total_revenue": 14500.00,
    "total_quantity": 150,
    "orders_count": 45,
    "average_ticket": 333.33,
    "total_discounts": 300.00,
    "total_adjustments": -200.00,
    "status": "published",
    
    "salesByOrderType": [
      { "order_type": "dine_in", "quantity": 80, "total": 9000.00 },
      { "order_type": "take_out", "quantity": 50, "total": 4500.00 },
      { "order_type": "delivery", "quantity": 20, "total": 1500.00 }
    ],
    
    "paymentMethods": [
      { "payment_type": "cash", "quantity": 20, "total": 6000.00 },
      { "payment_type": "card", "quantity": 20, "total": 7500.00 },
      { "payment_type": "transfer", "quantity": 5, "total": 1500.00 }
    ],
    
    "dynamicDiscounts": [
      { "discount_name": "Happy Hour 20%", "quantity": 10, "total": 300.00 }
    ],
    
    "adjustments": [
      { "adjustment_type": "return", "quantity": 2, "total": -200.00 }
    ]
  }'
```

---

## 📊 Queries Multi-Tenant

### Cómo Funcionan

```typescript
// En ReportsRepository (extiende BaseRepository)
async findAll(query: QueryReportDto) {
  return await this.withSchema(async () => {
    // SET search_path TO {tenant_schema}, public
    return await this.repository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.store', 'store')  // JOIN a public.stores
      .where('report.deletedAt IS NULL')
      .getMany();
    // SET search_path TO public
  });
}
```

**Resultado:** Queries ejecutan en `restaurant_valle_schema` pero JOINs a `public.stores` funcionan correctamente.

---

## 🔧 Reglas de Negocio

1. ✅ **Un reporte por tienda por día** (UNIQUE constraint)
2. ✅ **report_date no puede ser futuro**
3. ✅ **total_sales >= total_revenue** (después de descuentos/ajustes)
4. ✅ **orders_count > 0** para reportes publicados
5. ✅ **Suma de payment_methods = total_sales**
6. ✅ **Solo ADMIN puede ver reportes de su company**
7. ✅ **Solo MANAGER puede ver reportes de tiendas asignadas**

---

## 📝 DTOs Principales

### CreateReportDto

```typescript
{
  store_id: string;                    // UUID requerido
  report_date: string;                 // YYYY-MM-DD
  report_type: 'daily' | 'weekly' | 'monthly';
  total_sales: number;                 // >= 0
  total_revenue: number;               // >= 0
  total_quantity: number;              // >= 0
  orders_count: number;                // >= 0
  average_ticket?: number;             // Calculado automáticamente
  total_discounts?: number;            // Default: 0
  total_adjustments?: number;          // Default: 0
  metadata?: Record<string, any>;
  status?: 'published' | 'draft' | 'archived';

  // Detalles (opcionales)
  salesByOrderType?: CreateSalesByOrderTypeDto[];
  paymentMethods?: CreatePaymentMethodDto[];
  dynamicDiscounts?: CreateDynamicDiscountDto[];
  adjustments?: CreateAdjustmentDto[];
}
```

---

## 🔗 Referencias

| Documento | Contenido |
|-----------|-----------|
| [MULTI-TENANT.md](../../../docs/MULTI-TENANT.md) | Sistema multi-tenant |
| [BASE-REPOSITORY.md](../../../docs/BASE-REPOSITORY.md) | BaseRepository |
| [StoreModule README](../store/README.md) | Relación con stores |
| [CompanyModule README](../company/README.md) | Multi-tenant companies |

---

> **Estado:** ✅ OPERATIVO (100% completo - FASE 15)
> **Endpoints:** 21
> **Entidades:** 6 (1 header + 5 detalles)
> **Schema:** Tenant-specific (schema-per-tenant)
> **Última actualización:** Enero 2025

# Company Module - Multi-Tenant

## 📚 Descripción

Módulo para gestionar empresas/tenants en arquitectura multi-tenant.

Cada empresa (`CompanyEntity`) tiene su propio schema de PostgreSQL para aislar completamente los datos de diferentes clientes.

## 🏗️ Arquitectura

```
PostgreSQL Database
├── Schema: public (Entidades estáticas)
│   ├── companies  ← CompanyEntity
│   ├── users      ← UserEntity (con companyId)
│   ├── roles
│   └── permissions
│
├── Schema: company_a_schema (Tenant A)
│   ├── products   ← Datos aislados
│   ├── sales
│   └── inventory
│
└── Schema: company_b_schema (Tenant B)
    ├── products   ← Datos aislados
    ├── sales
    └── inventory
```

## 📦 CompanyEntity

### Campos principales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | string | Nombre de la empresa |
| `schema` | string | Schema de PostgreSQL (único) |
| `domain` | string | Dominio completo (opcional) |
| `subdomain` | string | Subdominio (opcional) |
| `isActive` | boolean | Estado de la empresa |
| `settings` | jsonb | Configuración adicional |
| `plan` | string | Plan/tier (opcional) |

### Ejemplo de uso

```typescript
// Crear una company
const company = new CompanyEntity();
company.name = 'Restaurante Valle';
company.schema = 'restaurant_valle_schema';
company.subdomain = 'valle';
company.isActive = true;
company.settings = {
  maxUsers: 10,
  features: ['pos', 'inventory'],
};

await companyRepo.save(company);
```

## 🔗 Relación con Users

Cada usuario puede pertenecer a una empresa:

```typescript
// Usuario pertenece a una company
user.companyId = 'company-id-123';
user.company = companyEntity;

// Usuario sin company (usa schema public)
user.companyId = null;
user.company = null;
```

## 🔄 Flujo Multi-Tenant

1. **Request con JWT** → JwtAuthGuard valida token
2. **TenantGuard extrae userId** → Busca user.company
3. **Obtiene schema** → `user.company.schema` (ej: 'company_a_schema')
4. **Valida whitelist** → `SecurityConfigService.isSchemaAllowed()`
5. **Establece contexto** → `request.tenant = { schema, companyId, userId }`
6. **TenantInterceptor** → `SchemaContext.run(tenant, ...)`
7. **Repository ejecuta** → `SET search_path TO company_a_schema`
8. **Queries aisladas** → Solo datos del tenant actual

## 📋 Fases de Implementación

### ✅ FASE 1: Infraestructura (COMPLETADA)
- [x] CompanyEntity creada
- [x] UserEntity con relación a Company
- [x] SchemaContext service
- [x] DatabaseModule exportando SchemaContext

### ⏳ FASE 2: Tenant Guard (Pendiente)
- [ ] TenantExtractorService
- [ ] TenantGuard

### ⏳ FASE 3: Interceptor (Pendiente)
- [ ] TenantInterceptor
- [ ] BaseRepository con search_path

### ⏳ FASE 4: Integración (Pendiente)
- [ ] app.module.ts configurado
- [ ] Guards globales aplicados

### ⏳ FASE 5: Migración (Pendiente)
- [ ] Migration CreateCompanyTable
- [ ] Seeds de companies
- [ ] Tests

### ⏳ FASE 6: Ejemplo (Pendiente)
- [ ] Products module como ejemplo

## 🚀 Próximos Pasos

Ver: `/docs/MULTI-TENANT-PLAN.md` para el plan completo de implementación por fases.

---

**Estado:** FASE 1 COMPLETADA ✅
**Próxima fase:** FASE 2 - Tenant Guard y Extractor

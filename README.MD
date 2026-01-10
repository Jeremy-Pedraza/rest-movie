# Mokka Backend API

🚀 NestJS Backend API - Production Ready

## 📊 Estado del Proyecto

| Categoría | Estado | Progreso |
|-----------|--------|----------|
| Configuración Base | ✅ Completo | 100% |
| Shared Modules | 🔄 En progreso | 40% |
| Feature Modules | ⏳ Pendiente | 0% |
| Database (Migraciones) | ⏳ Pendiente | 0% |
| Testing | ⏳ Pendiente | 10% |

> **Última actualización:** Enero 2025

---

## 📋 Stack Tecnológico

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL + TypeORM
- **Cache**: Redis + ioredis
- **Queue**: Bull (Redis-based)
- **Auth**: JWT + Passport
- **Logger**: Winston
- **Docs**: Swagger/OpenAPI
- **Testing**: Jest 29.x

---

## 🛠️ Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd mokka-backend

# Instalar dependencias
yarn install

# Copiar variables de entorno
cp .env.example .env

# Configurar base de datos en .env
```

---

## 🚀 Ejecución

```bash
# Desarrollo
yarn start:dev

# Producción
yarn build
yarn start:prod

# Debug
yarn start:debug
```

---

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `yarn start:dev` | Iniciar en modo desarrollo con hot-reload |
| `yarn start:debug` | Iniciar en modo debug |
| `yarn start:prod` | Iniciar en modo producción |
| `yarn build` | Compilar para producción |
| `yarn lint` | Ejecutar ESLint |
| `yarn format` | Formatear código con Prettier |
| `yarn test` | Ejecutar tests unitarios |
| `yarn test:watch` | Tests en modo watch |
| `yarn test:cov` | Tests con coverage |
| `yarn test:e2e` | Tests end-to-end |
| `yarn migration:generate` | Generar migración |
| `yarn migration:run` | Ejecutar migraciones |
| `yarn migration:revert` | Revertir última migración |
| `yarn seed` | Ejecutar seeds |
| `yarn docs` | Generar documentación |

---

## 📂 Estructura del Proyecto

```
src/
├── @types/              # TypeScript type definitions ✅
├── config/              # Configuraciones (DB, Redis, JWT, etc.) ✅
├── constants/           # Constantes globales ✅
├── database/            # Migraciones, seeds, factories ⏳
├── decorators/          # Decoradores personalizados ✅
├── filters/             # Exception filters ✅
├── guards/              # Guards de autenticación/autorización ✅
├── interceptors/        # Interceptores globales ✅
├── middleware/          # Middleware ✅
├── modules/             # Módulos de la aplicación ⏳
├── pipes/               # Pipes de validación ✅
├── shared/              # Módulos compartidos 🔄
│   ├── common/          # DTOs, entities, interfaces base ✅
│   ├── database/        # TransactionService ✅
│   ├── redis/           # RedisService ⏳
│   ├── router/          # HTTP Client ⏳
│   └── utils/           # Helpers ⏳
├── app.module.ts        # Módulo principal ✅
├── app.controller.ts    # Controller raíz ✅
├── app.service.ts       # Service raíz ✅
└── main.ts              # Bootstrap de la aplicación ✅
```

**Leyenda:** ✅ Completo | 🔄 En progreso | ⏳ Pendiente

---

## 📦 Módulos Compartidos (src/shared/)

### ✅ common/ - Completado
Base reutilizable para todos los módulos.

| Archivo | Descripción |
|---------|-------------|
| `entities/base.entity.ts` | Entidad base con id, timestamps, soft delete |
| `dto/pagination.dto.ts` | DTO base para paginación |
| `dto/base-response.dto.ts` | DTOs para respuestas estándar |
| `dto/query-params.dto.ts` | DTO base para filtros/búsquedas |
| `interfaces/api-response.interface.ts` | Interface para respuestas API |
| `interfaces/paginated-response.interface.ts` | Interface para paginación |
| `interfaces/query-builder.interface.ts` | Interfaces para repositories |
| `sanitizer.service.ts` | Sanitización de datos de entrada |
| `handle-error.service.ts` | Manejo centralizado de errores |

### ✅ database/ - Completado
Utilidades para manejo de base de datos.

| Archivo | Descripción |
|---------|-------------|
| `transaction.service.ts` | Manejo de transacciones con commit/rollback automático |
| `database.module.ts` | Módulo global de database |

### ⏳ utils/ - Pendiente
Helpers de utilidad común.

### ⏳ redis/ - Pendiente
Servicio de Redis para cache.

### ⏳ router/ - Pendiente
Cliente HTTP para APIs externas.

---

## 🔐 Variables de Entorno

Ver `.env.example` para la lista completa de variables requeridas.

---

## 📖 Guías de Desarrollo

| Documento | Descripción |
|-----------|-------------|
| [MASTER.md](./docs/MASTER.md) | Guía maestra de arquitectura |
| [CODE-PATTERNS.md](./docs/CODE-PATTERNS.md) | Patrones de código |
| [API-STANDARDS.md](./docs/API-STANDARDS.md) | Estándares de API |
| [DATABASE-PATTERNS.md](./docs/DATABASE-PATTERNS.md) | Patrones de base de datos |
| [SECURITY-GUIDE.md](./docs/SECURITY-GUIDE.md) | Guía de seguridad |
| [PROGRESS.md](./docs/PROGRESS.md) | **Progreso de implementación** |
| [CAMBIOS-ARQUITECTURA.md](./docs/CAMBIOS-ARQUITECTURA.md) | Notas de cambios |

---

## 📚 Documentación API

- **Swagger UI**: http://localhost:3000/docs (cuando el servidor esté corriendo)

---

## 📄 Licencia

Softlogy S.A.S - Uso interno

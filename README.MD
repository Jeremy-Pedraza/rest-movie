# Mokka Backend API

🚀 NestJS Backend API - Production Ready

## 📋 Stack Tecnológico

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL + TypeORM
- **Cache**: Redis + ioredis
- **Queue**: Bull (Redis-based)
- **Auth**: JWT + Passport
- **Logger**: Winston
- **Docs**: Swagger/OpenAPI
- **Testing**: Jest

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

## 📚 Documentación

- **API Docs (Swagger)**: http://localhost:3000/docs
- **Guías de desarrollo**: `/docs/`

## 📂 Estructura del Proyecto

```
src/
├── @types/           # TypeScript type definitions
├── config/           # Configuraciones (DB, Redis, JWT, etc.)
├── constants/        # Constantes globales
├── database/         # Migraciones, seeds, factories
├── decorators/       # Decoradores personalizados
├── filters/          # Exception filters
├── guards/           # Guards de autenticación/autorización
├── interceptors/     # Interceptores globales
├── middleware/       # Middleware
├── modules/          # Módulos de la aplicación
├── pipes/            # Pipes de validación
├── shared/           # Módulos compartidos
├── app.module.ts     # Módulo principal
├── app.controller.ts # Controller raíz
├── app.service.ts    # Service raíz
└── main.ts           # Bootstrap de la aplicación
```

## 🔐 Variables de Entorno

Ver `.env.example` para la lista completa de variables requeridas.

## 📖 Guías de Desarrollo

| Documento | Descripción |
|-----------|-------------|
| [MASTER.md](./docs/MASTER.md) | Guía maestra de arquitectura |
| [CODE-PATTERNS.md](./docs/CODE-PATTERNS.md) | Patrones de código |
| [API-STANDARDS.md](./docs/API-STANDARDS.md) | Estándares de API |
| [DATABASE-PATTERNS.md](./docs/DATABASE-PATTERNS.md) | Patrones de base de datos |
| [SECURITY-GUIDE.md](./docs/SECURITY-GUIDE.md) | Guía de seguridad |

## 📄 Licencia

Softlogy S.A.S - Uso interno

# 📝 Logger Module - Sistema de Logs Centralizado

> **Estado:** ✅ OPERATIVO (100% completo)
> **Versión:** 1.0.0
> **Última actualización:** Enero 2025

---

## 📋 Descripción

El **LoggerModule** proporciona un sistema centralizado de logging con almacenamiento en PostgreSQL y Winston.

### Características Principales

- ✅ **Logs estructurados** en PostgreSQL
- ✅ **Búsqueda y filtrado** avanzado
- ✅ **Estadísticas** de logs
- ✅ **Cleanup automático** de logs antiguos
- ✅ **Buffer de escritura** (performance)
- ✅ **Winston** como motor de logging
- ✅ **LoggingInterceptor** global (excepto paths ignorados)

---

## 📦 LogEntity

```typescript
@Entity({ name: 'logs', schema: 'public' })
export class LogEntity {
  id: string;                          // UUID
  level: string;                       // debug, info, warn, error
  message: string;                     // Mensaje del log
  context: string | null;              // Contexto (módulo)
  metadata: Record<string, any> | null; // Datos adicionales
  
  // Request info
  request_id: string | null;           // UUIDv7 del request
  user_id: string | null;              // Usuario que generó el log
  service: string | null;              // Servicio/módulo
  action: string | null;               // Acción ejecutada
  
  // Error info
  error_code: string | null;           // Código de error (RES_3001, etc)
  stack: string | null;                // Stack trace
  
  // HTTP info
  ip: string | null;                   // IP del request
  user_agent: string | null;           // User agent
  method: string | null;               // GET, POST, etc
  url: string | null;                  // URL del request
  status_code: number | null;          // Status code HTTP
  response_time: number | null;        // Tiempo de respuesta (ms)
  
  // Timestamps
  timestamp: Date;                     // Timestamp del log
  created_at: Date;                    // Auditoría
}
```

---

## 🔌 Endpoints

### Logs (4)

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `POST` | `/logs` | Crear log manualmente | ADMIN, SYSTEM |
| `GET` | `/logs` | Listar logs con filtros | ADMIN, SYSTEM |
| `GET` | `/logs/:id` | Obtener log por ID | ADMIN, SYSTEM |
| `GET` | `/logs/request/:requestId` | Logs por request ID | ADMIN, SYSTEM |

### Estadísticas (3)

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `GET` | `/logs/stats` | Estadísticas generales | ADMIN, SYSTEM |
| `GET` | `/logs/stats/summary` | Resumen (cache 30s) | ADMIN, SYSTEM |
| `GET` | `/logs/stats/errors` | Top errores | ADMIN, SYSTEM |

### Cleanup (3)

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `DELETE` | `/logs/cleanup?days=30` | Eliminar logs > N días | ADMIN |
| `DELETE` | `/logs/cleanup/debug?days=3` | Eliminar logs debug | ADMIN |
| `POST` | `/logs/flush` | Forzar flush del buffer | ADMIN |

**Total:** 10 endpoints

---

## 📊 Niveles de Log

| Nivel | Uso | Retención |
|-------|-----|-----------|
| `debug` | Desarrollo, debugging | 3 días |
| `verbose` | Info detallada | 7 días |
| `info` | Info general | 30 días |
| `warn` | Advertencias | 60 días |
| `error` | Errores capturados | 90 días |
| `fatal` | Errores críticos | Indefinido |

---

## 🔄 LoggingInterceptor

### Configuración Global

El **LoggingInterceptor** está registrado como `APP_INTERCEPTOR` y logea automáticamente todos los requests HTTP.

**Excepto:**
- `/health*` - Health checks
- `/metrics*` - Métricas
- `/favicon.ico` - Assets estáticos
- Otros en `LOG_IGNORE_PATHS`

### Información Registrada

```typescript
{
  level: 'info',
  message: 'HTTP Request Completed',
  context: 'HTTP',
  request_id: '019abc12-3def-7890-abcd-ef1234567890',
  user_id: 'user-uuid',
  method: 'GET',
  url: '/api/v1/users',
  status_code: 200,
  response_time: 45,
  ip: '192.168.1.100',
  user_agent: 'Mozilla/5.0...'
}
```

---

## 💻 Uso del Servicio

### Inyectar en tu módulo

```typescript
import { LoggerService } from '@modules/logger';

@Injectable()
export class MiService {
  constructor(private readonly logger: LoggerService) {}

  async miMetodo() {
    this.logger.log('info', 'Operación completada', {
      context: 'MiService',
      metadata: { userId: '123', action: 'create' }
    });
  }
}
```

### Métodos Disponibles

```typescript
// Logs simples
logger.log(level: string, message: string, options?: LogOptions)
logger.debug(message: string, context?: string)
logger.info(message: string, context?: string)
logger.warn(message: string, context?: string)
logger.error(message: string, stack?: string, context?: string)

// Con opciones completas
logger.log('info', 'Usuario creado', {
  context: 'UserService',
  metadata: { email: 'user@example.com' },
  requestId: request.id,
  userId: user.id,
  action: 'create'
});
```

---

## 🔍 Consultas y Filtros

### Listar Logs

```bash
GET /logs?level=error&limit=50&page=1&startDate=2025-01-01&endDate=2025-01-17
```

**Query params:**
- `level` - Filtrar por nivel
- `context` - Filtrar por contexto
- `request_id` - Filtrar por request ID
- `user_id` - Filtrar por usuario
- `startDate` - Desde fecha
- `endDate` - Hasta fecha
- `page` - Página (default: 1)
- `limit` - Items por página (default: 50, max: 200)

**Response:**
```json
{
  "success": true,
  "message": "Logs obtenidos exitosamente",
  "data": {
    "data": [
      {
        "id": "log-uuid",
        "level": "error",
        "message": "Usuario no encontrado",
        "context": "UserService",
        "error_code": "RES_3001",
        "timestamp": "2025-01-17T12:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 50,
      "total": 1250,
      "totalPages": 25
    }
  }
}
```

---

## 📊 Estadísticas

### Resumen General

```bash
GET /logs/stats/summary
```

**Response:**
```json
{
  "success": true,
  "message": "Resumen obtenido",
  "data": {
    "total": 125000,
    "by_level": {
      "debug": 50000,
      "info": 60000,
      "warn": 10000,
      "error": 5000
    },
    "last_24h": {
      "total": 5000,
      "errors": 120
    },
    "top_contexts": [
      { "context": "UserService", "count": 15000 },
      { "context": "AuthService", "count": 12000 }
    ]
  }
}
```

### Top Errores

```bash
GET /logs/stats/errors?limit=10&days=7
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "error_code": "RES_3001",
      "message": "Not Found",
      "count": 450,
      "last_occurrence": "2025-01-17T12:00:00.000Z"
    },
    {
      "error_code": "RES_1001",
      "message": "Validation Error",
      "count": 320,
      "last_occurrence": "2025-01-17T11:30:00.000Z"
    }
  ]
}
```

---

## 🧹 Cleanup de Logs

### Eliminar Logs Antiguos

```bash
DELETE /logs/cleanup?days=30
```

**Elimina logs con más de 30 días.**

**Response:**
```json
{
  "success": true,
  "message": "Se eliminaron 15000 logs",
  "data": {
    "deleted": 15000
  }
}
```

### Eliminar Logs de Debug

```bash
DELETE /logs/cleanup/debug?days=3
```

**Elimina logs debug/verbose con más de 3 días.**

---

## ⚙️ Configuración

### Variables de Entorno

```env
# Logging
LOG_LEVEL=info                       # debug, info, warn, error
LOG_TO_DATABASE=true                 # Guardar en BD
LOG_TO_FILE=true                     # Guardar en archivos
LOG_FILE_PATH=./logs                 # Path de logs
LOG_MAX_FILE_SIZE=10m                # Tamaño máximo por archivo
LOG_MAX_FILES=30d                    # Retención de archivos

# Cleanup
LOG_RETENTION_DAYS=30                # Días de retención general
LOG_DEBUG_RETENTION_DAYS=3           # Días retención debug
```

### Log Ignore Paths

Configurar en `src/constants/log-ignore-paths.constant.ts`:

```typescript
export const LOG_IGNORE_PATHS = [
  '/health',
  '/health/ready',
  '/metrics',
  '/favicon.ico',
];
```

---

## 📁 Archivos de Log (Winston)

### Ubicación

```
logs/
├── combined/
│   ├── combined-2025-01-17.log
│   └── combined-2025-01-16.log
├── error/
│   ├── error-2025-01-17.log
│   └── error-2025-01-16.log
└── access/
    ├── access-2025-01-17.log
    └── access-2025-01-16.log
```

### Rotación

- **Diaria** - Un archivo por día
- **Tamaño máximo** - 10MB por archivo
- **Retención** - 30 días

---

## 🔧 Troubleshooting

### Problema 1: Buffer no se vacía

**Síntoma:** Logs no aparecen en BD inmediatamente.

**Causa:** Buffer de escritura (performance).

**Solución:**
```bash
POST /logs/flush
```

---

### Problema 2: Demasiados logs debug

**Síntoma:** Base de datos crece rápido.

**Solución:**
```bash
# Eliminar logs debug antiguos
DELETE /logs/cleanup/debug?days=1

# Cambiar LOG_LEVEL en producción
LOG_LEVEL=info
```

---

## 🔗 Referencias

| Documento | Contenido |
|-----------|-----------|
| [Winston](https://github.com/winstonjs/winston) | Motor de logging |
| [NestJS Logger](https://docs.nestjs.com/techniques/logger) | Logger oficial |

---

> **Estado:** ✅ OPERATIVO (100% completo)
> **Endpoints:** 10
> **Almacenamiento:** PostgreSQL + archivos
> **Última actualización:** Enero 2025

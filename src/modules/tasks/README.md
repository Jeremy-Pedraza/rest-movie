# ⏰ Tasks Module - Tareas Programadas (Cron)

> **Estado:** ✅ OPERATIVO (100% completo)
> **Versión:** 1.0.0
> **Última actualización:** Enero 2025

---

## 📋 Descripción

El **TasksModule** gestiona tareas programadas (cron jobs) usando **@nestjs/schedule**.

### Características Principales

- ✅ **3 Tareas Predefinidas** (Cleanup, SessionCleanup, Backup)
- ✅ **Gestión completa** (listar, ejecutar, habilitar, deshabilitar)
- ✅ **Historial de ejecuciones** (con almacenamiento en BD)
- ✅ **Estadísticas** y métricas
- ✅ **Ejecución manual** con parámetros
- ✅ **Bloqueo de concurrencia** (previene ejecuciones simultáneas)
- ✅ **Próximas ejecuciones** calculadas

---

## 🔌 Endpoints

### Gestión (3)

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `GET` | `/tasks` | Listar tareas | ADMIN, MANAGER |
| `GET` | `/tasks/stats` | Estadísticas (cache 60s) | ADMIN |
| `GET` | `/tasks/next-runs` | Próximas ejecuciones | ADMIN, MANAGER |

### Detalle (2)

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `GET` | `/tasks/:name` | Detalle de tarea | ADMIN, MANAGER |
| `GET` | `/tasks/:name/history` | Historial de ejecuciones | ADMIN, MANAGER |

### Acciones (3)

| Método | Ruta | Descripción | Permisos |
|--------|------|-------------|----------|
| `POST` | `/tasks/:name/run` | Ejecutar manualmente | ADMIN |
| `POST` | `/tasks/:name/enable` | Habilitar tarea | ADMIN |
| `POST` | `/tasks/:name/disable` | Deshabilitar tarea | ADMIN |

**Total:** 8 endpoints

---

## 🎯 Tareas Predefinidas

### 1. Cleanup (Limpieza General)

**Archivo:** `src/modules/tasks/jobs/cleanup.job.ts`

**Cron:** `0 2 * * *` (2:00 AM diario)

**Descripción:** Limpia datos obsoletos del sistema.

**Acciones:**
- Elimina logs > 30 días
- Elimina sesiones expiradas
- Limpia cache obsoleto
- Elimina archivos temporales

**Ejecución manual:**
```bash
POST /tasks/cleanup/run
{
  "force": true,
  "dry_run": false,
  "parameters": {
    "log_days": 30,
    "session_days": 7
  }
}
```

---

### 2. Session Cleanup (Limpieza de Sesiones)

**Archivo:** `src/modules/tasks/jobs/session-cleanup.job.ts`

**Cron:** `*/30 * * * *` (Cada 30 minutos)

**Descripción:** Limpia sesiones expiradas de autenticación.

**Acciones:**
- Elimina sesiones con `expiresAt < NOW()`
- Elimina sesiones revocadas > 24h
- Actualiza estadísticas de sesiones

---

### 3. Backup (Respaldo de BD)

**Archivo:** `src/modules/tasks/jobs/backup.job.ts`

**Cron:** `0 3 * * 0` (3:00 AM domingos)

**Descripción:** Genera backup de la base de datos.

**Acciones:**
- Dump de PostgreSQL
- Compresión con gzip
- Upload a S3/storage
- Retención de 30 días

**Nota:** Requiere configuración de AWS S3 o storage local.

---

## 📊 Listar Tareas

```bash
GET /tasks
```

**Response:**
```json
{
  "success": true,
  "message": "Tareas obtenidas exitosamente",
  "data": {
    "tasks": [
      {
        "name": "cleanup",
        "description": "Limpieza general del sistema",
        "cron": "0 2 * * *",
        "human_cron": "Diariamente a las 2:00 AM",
        "enabled": true,
        "running": false,
        "last_run": {
          "date": "2025-01-17T02:00:00.000Z",
          "duration_ms": 1250,
          "success": true
        },
        "next_run": "2025-01-18T02:00:00.000Z",
        "executions_count": 150,
        "success_count": 148,
        "error_count": 2,
        "success_rate": 98.67
      },
      {
        "name": "session_cleanup",
        "description": "Limpieza de sesiones expiradas",
        "cron": "*/30 * * * *",
        "human_cron": "Cada 30 minutos",
        "enabled": true,
        "running": false,
        "last_run": {
          "date": "2025-01-17T12:00:00.000Z",
          "duration_ms": 450,
          "success": true
        },
        "next_run": "2025-01-17T12:30:00.000Z"
      }
    ],
    "total": 3,
    "enabled": 3,
    "disabled": 0,
    "running": 0
  }
}
```

---

## 📈 Estadísticas

```bash
GET /tasks/stats
```

**Response:**
```json
{
  "success": true,
  "message": "Estadísticas obtenidas",
  "data": {
    "total_tasks": 3,
    "enabled_tasks": 3,
    "disabled_tasks": 0,
    "running_tasks": 0,
    "total_executions": 5420,
    "successful_executions": 5380,
    "failed_executions": 40,
    "global_success_rate": 99.26,
    "avg_duration_ms": 850,
    "last_24h": {
      "executions": 98,
      "successes": 97,
      "errors": 1
    },
    "by_task": [
      {
        "name": "cleanup",
        "executions": 150,
        "success_rate": 98.67
      },
      {
        "name": "session_cleanup",
        "executions": 720,
        "success_rate": 100
      }
    ]
  }
}
```

---

## 🚀 Ejecutar Tarea Manualmente

```bash
POST /tasks/cleanup/run
{
  "force": true,
  "dry_run": false,
  "parameters": {
    "log_days": 15,
    "session_days": 3
  }
}
```

**Parámetros:**
- `force` - Ejecutar aunque esté en progreso (default: false)
- `dry_run` - Simular sin hacer cambios (default: false)
- `parameters` - Parámetros específicos de la tarea

**Response:**
```json
{
  "success": true,
  "message": "Tarea 'cleanup' ejecutada exitosamente",
  "data": {
    "name": "cleanup",
    "execution_id": "exec-uuid",
    "started_at": "2025-01-17T12:00:00.000Z",
    "finished_at": "2025-01-17T12:00:01.250Z",
    "duration_ms": 1250,
    "success": true,
    "result": {
      "logs_deleted": 5000,
      "sessions_deleted": 120,
      "cache_cleared": 450,
      "files_deleted": 30
    }
  }
}
```

---

## 🔄 Habilitar/Deshabilitar Tareas

### Deshabilitar

```bash
POST /tasks/cleanup/disable
{
  "reason": "Mantenimiento programado"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tarea 'cleanup' deshabilitada correctamente",
  "data": {
    "name": "cleanup",
    "enabled": false,
    "disabled_at": "2025-01-17T12:00:00.000Z",
    "disabled_by": "admin@example.com",
    "reason": "Mantenimiento programado"
  }
}
```

### Habilitar

```bash
POST /tasks/cleanup/enable
{
  "reason": "Finalizado mantenimiento"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tarea 'cleanup' habilitada correctamente",
  "data": {
    "name": "cleanup",
    "enabled": true,
    "enabled_at": "2025-01-17T13:00:00.000Z",
    "enabled_by": "admin@example.com",
    "reason": "Finalizado mantenimiento"
  }
}
```

---

## 📜 Historial de Ejecuciones

```bash
GET /tasks/cleanup/history?limit=10&page=1
```

**Response:**
```json
{
  "success": true,
  "message": "Historial de 'cleanup' obtenido",
  "data": {
    "task_name": "cleanup",
    "executions": [
      {
        "id": "exec-1",
        "started_at": "2025-01-17T02:00:00.000Z",
        "finished_at": "2025-01-17T02:00:01.250Z",
        "duration_ms": 1250,
        "success": true,
        "trigger": "cron",
        "triggered_by": null,
        "result": {
          "logs_deleted": 5000,
          "sessions_deleted": 120
        }
      },
      {
        "id": "exec-2",
        "started_at": "2025-01-16T02:00:00.000Z",
        "finished_at": "2025-01-16T02:00:01.180Z",
        "duration_ms": 1180,
        "success": true,
        "trigger": "cron"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    }
  }
}
```

---

## 📅 Próximas Ejecuciones

```bash
GET /tasks/next-runs
```

**Response:**
```json
{
  "success": true,
  "message": "Próximas ejecuciones obtenidas",
  "data": {
    "next_runs": [
      {
        "task": "session_cleanup",
        "next_run": "2025-01-17T12:30:00.000Z",
        "in_minutes": 5,
        "cron": "*/30 * * * *"
      },
      {
        "task": "cleanup",
        "next_run": "2025-01-18T02:00:00.000Z",
        "in_minutes": 840,
        "cron": "0 2 * * *"
      },
      {
        "task": "backup",
        "next_run": "2025-01-19T03:00:00.000Z",
        "in_minutes": 2160,
        "cron": "0 3 * * 0"
      }
    ]
  }
}
```

---

## 🔧 Crear Nueva Tarea

### 1. Crear archivo en `src/modules/tasks/jobs/`

```typescript
// mi-tarea.job.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MiTareaJob {
  private readonly logger = new Logger(MiTareaJob.name);
  private isRunning = false;

  @Cron(CronExpression.EVERY_HOUR)
  async execute() {
    if (this.isRunning) {
      this.logger.warn('Tarea ya en ejecución, saltando...');
      return;
    }

    this.isRunning = true;
    this.logger.log('Iniciando mi tarea...');

    try {
      // Tu lógica aquí
      
      this.logger.log('Tarea completada exitosamente');
    } catch (error) {
      this.logger.error('Error en tarea', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }
}
```

### 2. Registrar en `tasks.module.ts`

```typescript
import { MiTareaJob } from './jobs/mi-tarea.job';

@Module({
  providers: [
    TasksService,
    CleanupJob,
    SessionCleanupJob,
    BackupJob,
    MiTareaJob,  // ← Agregar aquí
  ],
})
export class TasksModule {}
```

---

## ⏰ Expresiones Cron

| Expresión | Descripción |
|-----------|-------------|
| `* * * * *` | Cada minuto |
| `*/5 * * * *` | Cada 5 minutos |
| `0 * * * *` | Cada hora |
| `0 0 * * *` | Diario a medianoche |
| `0 2 * * *` | Diario a las 2 AM |
| `0 0 * * 0` | Domingos a medianoche |
| `0 0 1 * *` | Primer día de cada mes |

**Generador:** https://crontab.guru/

---

## 🔗 Referencias

| Documento | Contenido |
|-----------|-----------|
| [@nestjs/schedule](https://docs.nestjs.com/techniques/task-scheduling) | Documentación oficial |
| [node-cron](https://www.npmjs.com/package/node-cron) | Cron syntax |

---

> **Estado:** ✅ OPERATIVO (100% completo)
> **Endpoints:** 8
> **Tareas predefinidas:** 3 (Cleanup, SessionCleanup, Backup)
> **Última actualización:** Enero 2025

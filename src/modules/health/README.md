# 💚 Health Module - Monitoreo y Health Checks

> **Estado:** ✅ OPERATIVO (100% completo)
> **Versión:** 1.0.0
> **Última actualización:** Enero 2025

---

## 📋 Descripción

El **HealthModule** proporciona health checks y métricas para monitoreo de la aplicación usando **@nestjs/terminus**.

### Características Principales

- ✅ **Liveness probe** - Verifica que la aplicación está corriendo
- ✅ **Readiness probe** - Verifica que todos los servicios están listos
- ✅ **Health checks individuales** - Database, Redis, Memory, Disk
- ✅ **Métricas detalladas** - PostgreSQL, Redis, Memory
- ✅ **Info del sistema** - Node version, uptime, environment
- ✅ **Público** - Todos los endpoints sin autenticación
- ✅ **Sin tenant** - @SkipTenant() aplicado

---

## 🔌 Endpoints

### Health Checks (5)

| Método | Ruta | Descripción | Uso |
|--------|------|-------------|-----|
| `GET` | `/health` | Liveness probe básico | Kubernetes liveness |
| `GET` | `/health/ready` | Readiness check completo | Kubernetes readiness |
| `GET` | `/health/database` | Health check PostgreSQL | Monitoreo |
| `GET` | `/health/redis` | Health check Redis | Monitoreo |
| `GET` | `/health/memory` | Health check memoria | Monitoreo |
| `GET` | `/health/disk` | Health check disco | Monitoreo |

### Métricas (3)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health/metrics/database` | Métricas PostgreSQL |
| `GET` | `/health/metrics/redis` | Métricas Redis |
| `GET` | `/health/metrics/memory` | Métricas memoria |

### Info (1)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health/info` | Información del sistema |

**Total:** 10 endpoints

---

## 🎯 Health Checks

### 1. Liveness Probe (GET /health)

**Propósito:** Verifica que la aplicación está corriendo.

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-17T12:00:00.000Z"
}
```

**Uso en Kubernetes:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
```

---

### 2. Readiness Probe (GET /health/ready)

**Propósito:** Verifica que todos los servicios están listos (DB, Redis, Memory).

**Response 200:**
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    }
  },
  "details": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    }
  }
}
```

**Response 503 (si falla):**
```json
{
  "status": "error",
  "info": {
    "database": {
      "status": "down",
      "message": "Connection timeout"
    }
  }
}
```

**Uso en Kubernetes:**
```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

---

### 3. Database Health (GET /health/database)

**Verifica:** Conexión a PostgreSQL.

**Response 200:**
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  }
}
```

---

### 4. Redis Health (GET /health/redis)

**Verifica:** Conexión a Redis.

**Response 200:**
```json
{
  "status": "ok",
  "info": {
    "redis": {
      "status": "up"
    }
  }
}
```

---

### 5. Memory Health (GET /health/memory)

**Verifica:** 
- Heap < 300MB
- RSS < 500MB

**Response 200:**
```json
{
  "status": "ok",
  "info": {
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    }
  }
}
```

---

### 6. Disk Health (GET /health/disk)

**Verifica:** Uso de disco < 90%

**Response 200:**
```json
{
  "status": "ok",
  "info": {
    "disk": {
      "status": "up"
    }
  }
}
```

---

## 📊 Métricas

### 1. Database Metrics (GET /health/metrics/database)

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-17T12:00:00.000Z",
  "metrics": {
    "ping": 2,
    "uptime": 3600000,
    "connectionCount": 10
  },
  "pool": {
    "total": 10,
    "idle": 8,
    "waiting": 0
  }
}
```

---

### 2. Redis Metrics (GET /health/metrics/redis)

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-17T12:00:00.000Z",
  "metrics": {
    "ping": "PONG",
    "dbsize": 1234,
    "used_memory": "10.5MB",
    "connected_clients": 5
  },
  "latency": "2ms",
  "memory": {
    "used": "10.5MB",
    "peak": "15.2MB"
  }
}
```

---

### 3. Memory Metrics (GET /health/metrics/memory)

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-17T12:00:00.000Z",
  "memory": {
    "heapUsed": "45.32 MB",
    "heapTotal": "60.50 MB",
    "external": "2.15 MB",
    "rss": "120.45 MB",
    "arrayBuffers": "0.50 MB"
  },
  "raw": {
    "heapUsed": 47534080,
    "heapTotal": 63438848,
    "external": 2254864,
    "rss": 126312448,
    "arrayBuffers": 524288
  }
}
```

---

## 🖥️ System Info (GET /health/info)

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-17T12:00:00.000Z",
  "app": {
    "name": "Rest-backend",
    "version": "1.0.0",
    "environment": "production"
  },
  "node": {
    "version": "v20.10.0",
    "platform": "linux",
    "arch": "x64"
  },
  "uptime": {
    "process": "3600s",
    "system": "86400s"
  },
  "pid": 1234
}
```

---

## 🔧 Health Indicators

### DatabaseHealthIndicator

**Métodos:**
- `isHealthy(key: string)` - Verifica conexión
- `getMetrics()` - Retorna métricas
- `getPoolStatus()` - Estado del pool

### RedisHealthIndicator

**Métodos:**
- `isHealthy(key: string)` - Verifica conexión
- `getMetrics()` - Retorna métricas
- `getLatency()` - Latency en ms
- `getMemoryStatus()` - Uso de memoria

---

## 🚀 Integración con Kubernetes

### Configuración Completa

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rest-backend
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: rest-backend:latest
        ports:
        - containerPort: 3000
        
        # Liveness: Reinicia si falla
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        # Readiness: Quita del load balancer si falla
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        
        # Resources
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

---

## 📊 Monitoreo con Prometheus

### Endpoint de Métricas

Usar `/health/metrics/*` endpoints para scraping.

**Ejemplo scrape config:**
```yaml
scrape_configs:
  - job_name: 'rest-backend'
    metrics_path: '/health/metrics/database'
    static_configs:
      - targets: ['backend:3000']
```

---

## 🔗 Referencias

| Documento | Contenido |
|-----------|-----------|
| [@nestjs/terminus](https://docs.nestjs.com/recipes/terminus) | Documentación oficial |
| [Kubernetes probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) | Liveness/Readiness |

---

> **Estado:** ✅ OPERATIVO (100% completo)
> **Endpoints:** 10 (5 health checks, 3 métricas, 1 info, 1 liveness)
> **Última actualización:** Enero 2025

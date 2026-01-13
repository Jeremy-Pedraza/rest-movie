# QueueModule

Sistema de colas con Bull + Redis para procesamiento asíncrono.

## 📚 Documentación Completa

Toda la documentación está centralizada en `/docs`:

- **[QUEUE-MODULE.md](../../../docs/QUEUE-MODULE.md)** - Guía completa de uso
- **[INTEGRATION-STATUS.md](../../../docs/INTEGRATION-STATUS.md)** - Estado de integración
- **[CODE-PATTERNS.md](../../../docs/CODE-PATTERNS.md)** - Patrones de implementación
- **[MASTER.md](../../../docs/MASTER.md)** - Reglas del proyecto

## 🚀 Uso Rápido

### 1. Importar en tu módulo

```typescript
import { QueueModule } from '@modules/queue';

@Module({
  imports: [QueueModule],
})
export class MiModule {}
```

### 2. Inyectar Producer

```typescript
import { EmailProducer } from '@modules/queue';

@Injectable()
export class MiService {
  constructor(
    private readonly emailProducer: EmailProducer,
  ) {}
}
```

### 3. Encolar Jobs

```typescript
// Email simple
await this.emailProducer.queueEmail({
  to: 'user@example.com',
  subject: 'Asunto',
  content: '<h1>Contenido</h1>',
});

// Email urgente
await this.emailProducer.queueEmailUrgent({...});

// Reporte
await this.reportProducer.queueMonthlySalesReport(userId, 2025, 1);
```

## 📦 Componentes

- **3 Colas:** email-queue, notification-queue, report-queue
- **3 Processors:** Procesamiento background
- **3 Producers:** 47 métodos de encolado
- **15 Endpoints REST:** Monitoreo y gestión

## ⚙️ Variables de Entorno

```env
BULL_REDIS_HOST=localhost
BULL_REDIS_PORT=6379
APP_URL=http://localhost:3000
```

## 🔗 Ver Documentación Completa

👉 **[docs/QUEUE-MODULE.md](../../../docs/QUEUE-MODULE.md)**

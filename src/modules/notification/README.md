# 📧 Módulo Notification - Mokka Backend

> Sistema de notificaciones multi-canal (Email, SMS, Push)
> **Estado:** 🔄 FASE 1 Completada - En desarrollo
> **Última actualización:** Enero 2025

---

## 📋 Índice

1. [Descripción General](#-descripción-general)
2. [Estado de Implementación](#-estado-de-implementación)
3. [Arquitectura](#-arquitectura)
4. [Canales Disponibles](#-canales-disponibles)
5. [DTOs y Validaciones](#-dtos-y-validaciones)
6. [Configuración](#-configuración)
7. [Plan de Desarrollo](#-plan-de-desarrollo)

---

## 📖 Descripción General

Sistema completo de notificaciones que soporta múltiples canales de comunicación:

- **Email** (Nodemailer + SMTP)
- **SMS** (Twilio)
- **Push Notifications** (Firebase Cloud Messaging)

### Características Principales

✅ **Multi-canal**: Envío por uno o varios canales simultáneamente
✅ **Asíncrono**: Envío mediante colas Bull para alta disponibilidad
✅ **Templates**: Sistema de templates reutilizables
✅ **Retry**: Reintentos automáticos con backoff exponencial
✅ **Rate Limiting**: Control de límites por canal
✅ **Tracking**: Seguimiento de estado y estadísticas
✅ **Programación**: Envío diferido/programado

---

## 📊 Estado de Implementación

### ✅ FASE 1: Estructura Base + Configuración (COMPLETADA)

| Componente | Estado | Archivos |
|------------|--------|----------|
| **DTOs** | ✅ | 5 archivos |
| **Interfaces** | ✅ | 4 archivos |
| **Módulo Base** | ✅ | 1 archivo |
| **Configuración** | ✅ | .env.example actualizado |

**Archivos creados (10):**
```
src/modules/notification/
├── dto/
│   ├── send-notification.dto.ts    ✅
│   ├── send-email.dto.ts           ✅
│   ├── send-sms.dto.ts             ✅
│   ├── send-push.dto.ts            ✅
│   └── index.ts                    ✅
├── interfaces/
│   ├── notification-channel.interface.ts   ✅
│   ├── notification-options.interface.ts   ✅
│   ├── notification-response.interface.ts  ✅
│   └── index.ts                            ✅
├── notification.module.ts          ✅
└── index.ts                        ✅
```

### ⏳ FASES PENDIENTES

| Fase | Estado | Progreso |
|------|--------|----------|
| FASE 2: Canales de Notificación | ⏳ Pendiente | 0% |
| FASE 3: Templates | ⏳ Pendiente | 0% |
| FASE 4: Service + Controller | ⏳ Pendiente | 0% |
| FASE 5: Integración con Queue | ⏳ Pendiente | 0% |
| FASE 6: Testing | ⏳ Pendiente | 0% |

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                     NotificationController                    │
│  POST /notifications/email                                   │
│  POST /notifications/sms                                     │
│  POST /notifications/push                                    │
│  POST /notifications/multi                                   │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                     NotificationService                       │
│  - Validar opciones                                          │
│  - Seleccionar canal(es)                                     │
│  - Aplicar templates                                         │
│  - Encolar o enviar directo                                  │
└────────┬─────────────────┬───────────────────┬───────────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐
│  EmailChannel   │ │  SmsChannel  │ │  PushChannel    │
│  (Nodemailer)   │ │  (Twilio)    │ │  (Firebase FCM) │
└─────────────────┘ └──────────────┘ └─────────────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│                     Bull Queue (Async)                        │
│  - email-notifications                                       │
│  - sms-notifications                                         │
│  - push-notifications                                        │
└──────────────────────────────────────────────────────────────┘
```

### Patrón Strategy

Cada canal implementa la interface `INotificationChannel`:

```typescript
interface INotificationChannel {
  readonly name: NotificationChannel;
  validate(options: INotificationOptions): Promise<boolean>;
  send(options: INotificationOptions): Promise<INotificationResponse>;
  getStatus?(messageId: string): Promise<NotificationStatus>;
  isAvailable(): Promise<boolean>;
}
```

---

## 📬 Canales Disponibles

### 1. Email Channel

**Proveedor:** Nodemailer  
**Estado:** ⏳ Pendiente (FASE 2)

**Características:**
- SMTP configurable
- Templates HTML/texto plano
- Archivos adjuntos
- CC/BCC
- Headers personalizados
- Reply-To

**Rate Limit:** 100 emails/minuto (configurable)

---

### 2. SMS Channel

**Proveedor:** Twilio  
**Estado:** ⏳ Pendiente (FASE 2)

**Características:**
- SMS transaccionales
- SMS promocionales
- SMS de alertas
- Número remitente personalizable
- Tracking de entrega
- Validación formato E.164

**Rate Limit:** 10 SMS/minuto (configurable)

---

### 3. Push Notification Channel

**Proveedor:** Firebase Cloud Messaging  
**Estado:** ⏳ Pendiente (FASE 2)

**Características:**
- Android + iOS + Web
- Notificaciones con imagen
- Deep linking
- Badges y sonidos
- Agrupación (tags)
- TTL configurable
- Foreground/Background

**Rate Limit:** 500 push/minuto (configurable)

---

## 📝 DTOs y Validaciones

### SendNotificationDto (Multi-canal)

Envío por uno o varios canales simultáneamente.

```typescript
{
  "channels": ["email", "sms"],
  "recipients": [
    {
      "email": "user@example.com",
      "phone": "+573001234567",
      "name": "Juan Pérez"
    }
  ],
  "subject": "Bienvenido a la plataforma",
  "message": "Gracias por registrarte",
  "priority": "high",
  "async": true
}
```

**Validaciones:**
- `channels`: Array de enums (email, sms, push)
- `recipients`: Array de objetos con al menos 1 elemento
- `subject`: 3-200 caracteres
- `message`: 10-5000 caracteres
- `priority`: Enum (low, normal, high, urgent)

---

### SendEmailDto

Envío específico de emails.

```typescript
{
  "to": ["user@example.com"],
  "cc": ["manager@example.com"],
  "replyTo": "support@example.com",
  "subject": "Bienvenido a la plataforma",
  "html": "<h1>Bienvenido</h1>",
  "template": "welcome-email",
  "templateData": {
    "userName": "Juan",
    "activationLink": "https://..."
  },
  "priority": "high"
}
```

**Validaciones:**
- `to`: Array de emails válidos (min 1)
- `cc/bcc`: Arrays de emails válidos (opcional)
- `subject`: 3-200 caracteres
- `html` o `text` o `template`: Al menos uno requerido
- `priority`: Enum (low, normal, high)

---

### SendSmsDto

Envío específico de SMS.

```typescript
{
  "to": ["+573001234567"],
  "message": "Tu código de verificación es: 123456",
  "type": "transactional",
  "from": "+573009876543",
  "campaignId": "registration-otp"
}
```

**Validaciones:**
- `to`: Array de teléfonos formato E.164 (min 1)
- `message`: 1-1600 caracteres
- `type`: Enum (transactional, promotional, alert)
- `from`: Teléfono formato E.164 (opcional)

---

### SendPushDto

Envío específico de Push Notifications.

```typescript
{
  "tokens": ["fcm_token_abc123"],
  "title": "Nueva actualización disponible",
  "body": "Haz clic para ver los detalles",
  "imageUrl": "https://example.com/image.png",
  "clickAction": "app://open-profile/123",
  "data": {
    "orderId": "12345",
    "type": "order-update"
  },
  "priority": "high",
  "platform": "android"
}
```

**Validaciones:**
- `tokens`: Array de strings (min 1)
- `title`: 1-100 caracteres
- `body`: 1-500 caracteres
- `imageUrl`: URL válida (opcional)
- `priority`: Enum (low, normal, high)
- `platform`: Enum (android, ios, web)

---

## ⚙️ Configuración

### Variables de Entorno

Todas las variables están documentadas en `.env.example`:

#### Email (Nodemailer)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your_smtp_password_here
SMTP_FROM=noreply@example.com
SMTP_FROM_NAME=Mokka Backend
EMAIL_RATE_LIMIT=100
```

#### SMS (Twilio)
```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SMS_RATE_LIMIT=10
```

#### Push (Firebase)
```env
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_DATABASE_URL=
PUSH_RATE_LIMIT=500
```

#### General
```env
NOTIFICATION_EMAIL_ENABLED=true
NOTIFICATION_SMS_ENABLED=false
NOTIFICATION_PUSH_ENABLED=false
NOTIFICATION_MAX_RETRIES=3
NOTIFICATION_RETRY_DELAY=1000
```

---

## 📅 Plan de Desarrollo

### FASE 2: Canales de Notificación (⏳ Siguiente)

**Duración estimada:** 30 minutos

**Archivos a crear:**
```
src/modules/notification/
├── channels/
│   ├── notification-channel.abstract.ts  # Clase abstracta base
│   ├── email.channel.ts                  # Implementación Email
│   ├── sms.channel.ts                    # Implementación SMS
│   ├── push.channel.ts                   # Implementación Push
│   └── index.ts
```

**Tareas:**
- [ ] Crear clase abstracta `NotificationChannel`
- [ ] Implementar `EmailChannel` con Nodemailer
- [ ] Implementar `SmsChannel` con Twilio (stub para testing)
- [ ] Implementar `PushChannel` con Firebase (stub para testing)
- [ ] Agregar validaciones de configuración
- [ ] Método `isAvailable()` para verificar configuración

---

### FASE 3: Templates (⏳ Pendiente)

**Duración estimada:** 20 minutos

**Archivos a crear:**
```
src/modules/notification/
├── templates/
│   ├── base.template.ts
│   ├── welcome-email.template.ts
│   ├── reset-password.template.ts
│   ├── verify-email.template.ts
│   ├── notification-email.template.ts
│   └── index.ts
```

---

### FASE 4: Service + Controller (⏳ Pendiente)

**Duración estimada:** 40 minutos

**Archivos a crear:**
```
src/modules/notification/
├── notification.service.ts
└── notification.controller.ts
```

**Endpoints:**
- `POST /notifications/email`
- `POST /notifications/sms`
- `POST /notifications/push`
- `POST /notifications/multi`
- `POST /notifications/template`

---

### FASE 5: Integración con Queue (⏳ Pendiente)

**Duración estimada:** 30 minutos

**Archivos a crear:**
```
src/modules/notification/
├── processors/
│   └── notification.processor.ts
├── producers/
│   └── notification.producer.ts
└── queues/
    └── notification.queue.ts
```

---

### FASE 6: Testing (⏳ Pendiente)

**Duración estimada:** 30 minutos

**Archivos a crear:**
```
src/modules/notification/
└── tests/
    ├── notification.service.spec.ts
    ├── notification.controller.spec.ts
    ├── email.channel.spec.ts
    └── notification.e2e-spec.ts
```

---

## 🎯 Próximos Pasos

1. ✅ **FASE 1 COMPLETADA** - Estructura Base + Configuración
2. ⏳ **FASE 2** - Implementar canales (Email, SMS, Push)
3. ⏳ **FASE 3** - Crear templates reutilizables
4. ⏳ **FASE 4** - Service + Controller + Endpoints
5. ⏳ **FASE 5** - Integración con Bull Queue
6. ⏳ **FASE 6** - Testing completo

---

## 📚 Referencias

- [Nodemailer Documentation](https://nodemailer.com/)
- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Bull Queue](https://github.com/OptimalBits/bull)

---

> **Nota:** Este documento se actualiza después de cada fase completada.

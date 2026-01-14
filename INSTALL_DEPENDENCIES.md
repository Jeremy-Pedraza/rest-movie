# 📦 Instalar Dependencias Faltantes

## Dependencias para NotificationModule y AuthModule

Ejecuta el siguiente comando en la raíz del proyecto:

```bash
yarn add nodemailer twilio firebase-admin passport-local
```

O si usas npm:

```bash
npm install nodemailer twilio firebase-admin passport-local
```

## Tipos TypeScript

También necesitas instalar los tipos para desarrollo:

```bash
yarn add -D @types/nodemailer @types/passport-local
```

O con npm:

```bash
npm install --save-dev @types/nodemailer @types/passport-local
```

## Verificar instalación

Después de instalar las dependencias, ejecuta:

```bash
yarn build
```

O:

```bash
npm run build
```

## Notas importantes

### Nodemailer
- **Requerido** para envío de emails
- Configura las variables de entorno SMTP en `.env`:
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=tu-email@gmail.com
  SMTP_PASSWORD=tu-contraseña-app
  SMTP_FROM="Mokka App" <noreply@mokka.com>
  ```

### Twilio
- **Opcional** para envío de SMS
- Si no configuras Twilio, el sistema usará modo stub (simulado)
- Variables de entorno:
  ```env
  TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
  TWILIO_AUTH_TOKEN=xxxxxxxxxxxx
  TWILIO_PHONE_NUMBER=+15551234567
  ```

### Firebase Admin
- **Opcional** para push notifications
- Si no configuras Firebase, el sistema usará modo stub (simulado)
- Variables de entorno:
  ```env
  FIREBASE_PROJECT_ID=mi-proyecto
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
  FIREBASE_CLIENT_EMAIL=firebase-adminsdk@mi-proyecto.iam.gserviceaccount.com
  ```

## Después de instalar

1. ✅ Reinicia el servidor de desarrollo
2. ✅ Verifica que no haya errores de compilación
3. ✅ Prueba el módulo de notificaciones con los endpoints disponibles

## Documentación

Para más información sobre el uso del módulo de notificaciones:
- `docs/NOTIFICATION-MODULE.md` - Documentación completa
- `docs/NOTIFICATION-INTEGRATION.md` - Guía de integración
- `docs/INTEGRATION-STATUS.md` - Estado de integración

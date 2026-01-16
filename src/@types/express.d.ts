// src/@types/express.d.ts

/**
 * @fileoverview Extensiones de tipos para Express
 * @module @types
 *
 * Este archivo extiende los tipos de Express para incluir
 * propiedades personalizadas en Request.
 *
 * IMPORTANTE: Este archivo NO debe tener imports de nivel superior
 * para que funcione como declaración global.
 */

/**
 * Contexto del tenant para multi-tenant
 */
interface ITenantContext {
  schema: string;
  companyId: string | null;
  userId: string | null;
}

/**
 * Permiso de usuario
 */
interface UserPermission {
  id: string;
  name: string;
  module: string;
  action: string;
  description?: string;
}

/**
 * Datos de sesión del usuario autenticado
 */
interface UserSessionData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string | null;
  schema: string | null;
  roles: string[];
  permissions: UserPermission[];
  status: string;
  emailVerified: boolean;
  session: {
    id: string;
    sessionUid: string;
    deviceId?: string;
    startedAt: Date;
    expiresAt?: Date;
  };
  company: {
    id: string;
    name: string;
    schema: string;
    isActive: boolean;
  };
  createdAt: Date;
  updatedAt?: Date;
}

declare global {
  namespace Express {
    interface User extends UserSessionData {}

    interface Request {
      /**
       * Usuario autenticado (agregado por Passport/JWT)
       */
      user?: UserSessionData;

      /**
       * Contexto del tenant para multi-tenant
       * Establecido por TenantGuard después de autenticación
       */
      tenant?: ITenantContext;

      /**
       * Token JWT desencriptado (para validaciones internas)
       */
      decryptedToken?: string;

      /**
       * ID único de la petición (UUIDv7)
       */
      requestId?: string;

      /**
       * Timestamp de inicio de la petición
       */
      startTime?: number;

      /**
       * Raw body para verificación de webhooks
       */
      rawBody?: Buffer;
    }
  }
}

// Export vacío para forzar que sea tratado como módulo
// pero manteniendo el declare global funcionando
export {};

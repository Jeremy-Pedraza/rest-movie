// src/@types/express.d.ts

/**
 * @fileoverview Extensiones de tipos para Express
 * @module @types
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    /**
     * Usuario autenticado en la request
     */
    interface User {
      id: string;
      email: string;
      roles?: string[];
    }

    interface Request {
      /**
       * Usuario autenticado (agregado por Passport/JWT)
       */
      user?: User;

      /**
       * ID único de la petición (UUIDv7)
       */
      requestId?: string;

      /**
       * Timestamp de inicio de la petición
       */
      startTime?: number;

      /**
       * Raw body para verificación de webhooks (Stripe, etc.)
       */
      rawBody?: Buffer;
    }
  }
}

export {};

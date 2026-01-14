// src/@types/express.d.ts

/**
 * @fileoverview Extensiones de tipos para Express
 * @module @types
 */

import type { ITenantContext } from '@shared/database';

declare global {
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

      /**
       * Contexto del tenant para multi-tenant
       * 
       * Establecido por TenantGuard después de autenticación
       * Contiene información del schema, company y user
       * 
       * @example
       * ```typescript
       * // En un controller
       * @Get()
       * findAll(@Req() req: Request) {
       *   const schema = req.tenant?.schema; // 'company_a_schema'
       *   const companyId = req.tenant?.companyId; // 'company-id-123'
       * }
       * ```
       */
      tenant?: ITenantContext;
    }
  }
}

export {};

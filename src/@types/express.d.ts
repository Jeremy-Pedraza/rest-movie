// src/@types/express.d.ts

/**
 * @fileoverview Extensiones de tipos para Express
 * @module @types
 */

import type { ITenantContext } from '@shared/database';
import { UserSessionDto } from '@modules/auth/interfaces';

declare global {
  namespace Express {
    /**
     * Usuario autenticado en la request
     * 
     * NOTA: Para endpoints autenticados, usar AuthRequest en lugar de Request
     * para tener acceso garantizado al usuario con todos sus datos.
     */
    interface User {
      id: string;
      email: string;
      roles?: string[];
    }

    interface Request {
      /**
       * Usuario autenticado (agregado por Passport/JWT)
       * 
       * Después de JwtAuthGuard, contiene UserSessionDto con:
       * - Datos del usuario
       * - Company (tenant)
       * - Schema
       * - Roles y permisos
       * - Información de sesión
       */
      user?: UserSessionDto;

      /**
       * Token JWT desencriptado (para validaciones internas)
       * @internal
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
       * Raw body para verificación de webhooks (Stripe, etc.)
       */
      rawBody?: Buffer;

      /**
       * Contexto del tenant para multi-tenant
       * 
       * @deprecated Usar request.user.schema en su lugar
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

/**
 * Request con usuario autenticado garantizado
 * 
 * Usar en controllers que requieren autenticación para tener
 * acceso type-safe a todos los datos del usuario.
 * 
 * @example
 * ```typescript
 * import { AuthRequest } from '@types/express';
 * 
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @UseGuards(JwtAuthGuard)
 *   async findAll(@Req() request: AuthRequest) {
 *     const userId = request.user.id;
 *     const schema = request.user.schema;
 *     const companyId = request.user.companyId;
 *     const roles = request.user.roles;
 *     const permissions = request.user.permissions;
 *   }
 * }
 * ```
 */
export interface AuthRequest extends Express.Request {
  user: UserSessionDto; // ← No opcional, siempre presente
}

export {};

// src/guards/jwt-auth.guard.ts

/**
 * @fileoverview Guard para autenticación JWT
 * @module guards
 *
 * Valida tokens JWT en endpoints protegidos.
 * Usar @Public() para marcar rutas que no requieren autenticación.
 */

import { IS_PUBLIC_KEY } from '@decorators/public.decorator';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { ERROR_CODES } from '@constants/error-codes.constant';
import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';

/**
 * Información del token JWT
 */
interface JwtInfo {
  name?: string;
  message?: string;
}

/**
 * Usuario autenticado
 */
export interface AuthUser {
  id: string;
  email: string;
  roles: string[]; // ✅ Ahora es obligatorio
  companyId: string | null; // ✅ Para multi-tenant
  schema: string | null; // ✅ Schema del tenant
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Verificar si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = AuthUser>(err: Error | null, user: TUser | false, info?: JwtInfo): TUser {
    // Token expirado
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        message: RESPONSE_MESSAGES.AUTH.TOKEN_EXPIRED,
        error: 'Unauthorized',
        code: ERROR_CODES.AUTH_TOKEN_EXPIRED,
      });
    }

    // Token inválido (malformado, firma incorrecta, etc.)
    if (info?.name === 'JsonWebTokenError') {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        message: RESPONSE_MESSAGES.AUTH.TOKEN_INVALID,
        error: 'Unauthorized',
        code: ERROR_CODES.AUTH_TOKEN_INVALID,
      });
    }

    // Sin token o error genérico
    if (err || !user) {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        message: info?.message || RESPONSE_MESSAGES.AUTH.UNAUTHORIZED,
        error: 'Unauthorized',
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
      });
    }

    return user;
  }
}

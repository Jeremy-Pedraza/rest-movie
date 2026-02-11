// src/middleware/domain-validation.middleware.ts

/**
 * @fileoverview Middleware para validar dominios permitidos
 * @module middleware
 *
 * Integrado con SecurityConfigService para:
 * - Validar dominios desde security-whitelist.json
 * - Log de intentos no autorizados
 * - Bloquear requests desde dominios no permitidos
 *
 * Características:
 * - Fuente única: security-whitelist.json (NO usa .env)
 * - Búsqueda O(1) con Set
 * - Hot-reload disponible (sin reiniciar servidor)
 * - Logging automático de rechazos
 */

import { Injectable, NestMiddleware, ForbiddenException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecurityConfigService } from '@config/security';

/**
 * Middleware para validar que el origen del request esté en la whitelist.
 *
 * Relación con CORS (main.ts):
 * - CORS opera a nivel HTTP (preflight OPTIONS + headers de respuesta).
 * - Este middleware complementa validando requests reales (GET, POST, etc.)
 *   y cubriendo el header Referer cuando Origin no está presente.
 * - Ambas capas usan SecurityConfigService como fuente única de verdad.
 *
 * Casos de uso:
 * - Requests desde navegador: Valida header 'Origin'
 * - Requests desde servidor: Valida header 'Referer'
 * - Requests directos (Postman, cURL): Se permiten (sin origin)
 *
 * Orden de ejecución:
 * 1. RequestIdMiddleware (genera UUID)
 * 2. LoggerMiddleware (log de entrada)
 * 3. DomainValidationMiddleware (valida dominio) ← ESTE
 *
 * @example
 * // En app.module.ts:
 * configure(consumer: MiddlewareConsumer) {
 *   consumer
 *     .apply(RequestIdMiddleware, LoggerMiddleware, DomainValidationMiddleware)
 *     .forRoutes('*');
 * }
 */
@Injectable()
export class DomainValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DomainValidationMiddleware.name);

  constructor(private readonly securityConfig: SecurityConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const rawOrigin = (req.headers.origin || req.headers.referer || '') as string;

    // Si no hay origin (Postman, cURL, requests server-to-server), permitir
    if (!rawOrigin) {
      return next();
    }

    // Parsear origin a hostname canónico para evitar bypasses
    const canonicalHost = this.extractHostname(rawOrigin);
    if (!canonicalHost) {
      // Origin mal formado: rechazar
      this.logger.warn(
        `Request bloqueado - origin mal formado | path=${req.method} ${req.path} | ip=${req.ip}`,
      );
      throw new ForbiddenException({
        success: false,
        statusCode: 403,
        message: 'Origen de la solicitud no es válido',
        error: 'Forbidden',
        code: 'SEC_403',
      });
    }

    // Validar con SecurityConfigService (lee de security-whitelist.json)
    const isAllowed = this.securityConfig.isDomainAllowed(canonicalHost);

    if (!isAllowed) {
      // Log interno con detalle técnico; respuesta al cliente sin exponer origin
      this.logger.warn(
        `Request bloqueado - dominio no permitido: ${canonicalHost} | path=${req.method} ${req.path} | ip=${req.ip}`,
      );

      throw new ForbiddenException({
        success: false,
        statusCode: 403,
        message: 'Origen de la solicitud no permitido',
        error: 'Forbidden',
        code: 'SEC_403',
      });
    }

    // Dominio permitido, continuar
    next();
  }

  /**
   * Extrae el hostname canónico de una URL de origin/referer.
   * Retorna null si el origin no es parseable.
   */
  private extractHostname(origin: string): string | null {
    try {
      // origin puede ser solo hostname o URL completa
      const url = origin.includes('://') ? origin : `https://${origin}`;
      const parsed = new URL(url);
      return parsed.hostname || null;
    } catch {
      return null;
    }
  }
}

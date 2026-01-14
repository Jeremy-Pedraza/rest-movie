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
 * Middleware para validar que el origen del request esté en la whitelist
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
    // Obtener origin del request
    const origin = req.headers.origin || req.headers.referer || '';

    // Si no hay origin (Postman, cURL, requests directos), permitir
    if (!origin) {
      return next();
    }

    // Validar con SecurityConfigService (lee de security-whitelist.json)
    const isAllowed = this.securityConfig.isDomainAllowed(origin);

    if (!isAllowed) {
      this.logger.warn(`🚫 Request bloqueado desde dominio no permitido: ${origin}`);
      this.logger.warn(`📍 Path: ${req.method} ${req.path}`);
      this.logger.warn(`🌐 IP: ${req.ip}`);

      throw new ForbiddenException({
        success: false,
        statusCode: 403,
        message: `Dominio no permitido: ${origin}`,
        error: 'Forbidden',
        code: 'SEC_403',
      });
    }

    // Dominio permitido, continuar
    next();
  }
}

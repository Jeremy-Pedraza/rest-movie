import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * Middleware para validar dominios permitidos
 * Útil para restringir acceso a dominios específicos
 */
@Injectable()
export class DomainValidationMiddleware implements NestMiddleware {
  private allowedDomains: string[];

  constructor(private readonly configService: ConfigService) {
    const corsOrigin = this.configService.get<string>('CORS_ORIGIN') || '*';
    this.allowedDomains = corsOrigin === '*' ? ['*'] : corsOrigin.split(',').map((d) => d.trim());
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Si se permite cualquier dominio, continuar
    if (this.allowedDomains.includes('*')) {
      return next();
    }

    const origin = req.headers.origin || req.headers.referer || '';

    // Extraer dominio del origin
    let domain = '';
    try {
      if (origin) {
        const url = new URL(origin);
        domain = url.origin;
      }
    } catch {
      domain = '';
    }

    // Verificar si el dominio está permitido
    const isAllowed =
      !origin || // Sin origin (requests directos, Postman, etc.)
      this.allowedDomains.some((allowed) => {
        return domain === allowed || domain.endsWith(allowed.replace('https://', '.'));
      });

    if (!isAllowed) {
      throw new ForbiddenException(`Dominio no permitido: ${domain}`);
    }

    next();
  }
}

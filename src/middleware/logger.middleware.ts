// src/middleware/logger.middleware.ts

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '-';
    const requestId = req.requestId || '-';
    const startTime = Date.now();

    // Log de entrada
    this.logger.debug(`→ ${method} ${originalUrl} [${requestId}] - ${ip} - ${userAgent}`);

    // Interceptar el response
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;
      const responseTime = Date.now() - startTime;

      const logMessage = `← ${method} ${originalUrl} ${statusCode} ${contentLength} - ${responseTime}ms [${requestId}] - ${ip}`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}

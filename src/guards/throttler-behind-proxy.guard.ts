import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  /**
   * Obtener el IP real cuando la app está detrás de un proxy
   * Útil para Nginx, AWS ELB, Cloudflare, etc.
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return (
      req.ips?.length > 0
        ? req.ips[0]
        : req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          req.headers['x-real-ip'] ||
          req.ip ||
          req.connection?.remoteAddress ||
          'unknown'
    );
  }
}

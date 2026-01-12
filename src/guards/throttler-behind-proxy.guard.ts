// src/guards/throttler-behind-proxy.guard.ts

import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  /**
   * Obtener el IP real cuando la app está detrás de un proxy
   * Útil para Nginx, AWS ELB, Cloudflare, etc.
   */
  protected override getTracker(req: Request): Promise<string> {
    const ip = this.extractClientIp(req);
    return Promise.resolve(ip);
  }

  /**
   * Extrae el IP del cliente de la request
   */
  private extractClientIp(req: Request): string {
    // 1. Prioridad: ips[] (cuando trust proxy está habilitado)
    if (req.ips && req.ips.length > 0) {
      return req.ips[0];
    }

    // 2. X-Forwarded-For header
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0]?.trim();
      if (ip) return ip;
    }

    // 3. X-Real-IP header
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // 4. IP directo de Express
    if (req.ip) {
      return req.ip;
    }

    // 5. Socket remoteAddress
    if (req.socket?.remoteAddress) {
      return req.socket.remoteAddress;
    }

    return 'unknown';
  }
}

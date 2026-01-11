import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Request } from 'express';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();

    // Solo cachear requests GET
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Generar key de cache basada en URL y query params
    const cacheKey = this.generateCacheKey(request);

    // Intentar obtener del cache
    const cachedResponse = await this.cacheManager.get(cacheKey);

    if (cachedResponse) {
      return of(cachedResponse);
    }

    // Si no está en cache, ejecutar y guardar
    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheManager.set(cacheKey, response, 60000); // 60 segundos por defecto
      }),
    );
  }

  /**
   * Genera una key única para el cache basada en la URL
   */
  private generateCacheKey(request: Request): string {
    const { originalUrl, query } = request;
    const queryString = Object.keys(query).length
      ? `?${new URLSearchParams(query as Record<string, string>).toString()}`
      : '';
    return `cache:${originalUrl}${queryString}`;
  }
}

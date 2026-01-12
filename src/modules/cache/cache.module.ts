// src/modules/cache/cache.module.ts

/**
 * @fileoverview Módulo de cache inteligente
 * @module modules/cache
 *
 * 🔧 CARACTERÍSTICAS:
 * - Cache de datos de negocio con remember()
 * - Invalidación inteligente por tags
 * - Estadísticas de uso (hits, misses, ratios)
 * - Cache warmup para datos críticos
 * - Serialización automática
 *
 * 📦 EXPORTS:
 * - CacheService (disponible para todos los módulos)
 *
 * 💡 USO EN OTROS MÓDULOS:
 * @Module({
 *   imports: [CacheModule],
 * })
 * export class UserModule {}
 */

import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';

@Global() // ✅ Disponible en toda la app sin imports
@Module({
  controllers: [CacheController],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}

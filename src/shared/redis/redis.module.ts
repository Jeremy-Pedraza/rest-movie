// src/shared/redis/redis.module.ts

/**
 * @fileoverview Módulo de Redis
 * @module shared/redis
 */

import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}

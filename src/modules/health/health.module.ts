// src/modules/health/health.module.ts

/**
 * @fileoverview Módulo de Health Checks
 * @module modules/health
 */

import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './health.controller';
import { DatabaseHealthIndicator } from './indicators/database.indicator';
import { RedisHealthIndicator } from './indicators/redis.indicator';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator, RedisHealthIndicator],
  exports: [DatabaseHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}

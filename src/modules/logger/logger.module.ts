// src/modules/logger/logger.module.ts

/**
 * @fileoverview Módulo de logging persistente
 * @module modules/logger
 */

import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoggerController } from './logger.controller';
import { LoggerService } from './logger.service';
import { LoggerRepository } from './logger.repository';
import { LogEntity } from './entities/log.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([LogEntity])],
  controllers: [LoggerController],
  providers: [LoggerService, LoggerRepository],
  exports: [LoggerService],
})
export class LoggerModule implements OnModuleDestroy {
  constructor(private readonly loggerService: LoggerService) {}

  /**
   * Al destruir el módulo, asegurarse de vaciar el buffer
   */
  async onModuleDestroy(): Promise<void> {
    await this.loggerService.stopAutoFlush();
  }
}

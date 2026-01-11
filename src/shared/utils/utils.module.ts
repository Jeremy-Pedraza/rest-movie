// src/shared/utils/utils.module.ts

/**
 * @fileoverview Módulo de utilidades
 * @module shared/utils
 */

import { Global, Module } from '@nestjs/common';
import { UtilsService } from './utils.service';

@Global()
@Module({
  providers: [UtilsService],
  exports: [UtilsService],
})
export class UtilsModule {}

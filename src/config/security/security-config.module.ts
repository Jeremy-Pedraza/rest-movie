// src/config/security/security-config.module.ts

/**
 * @fileoverview Módulo global de configuración de seguridad
 * @module config/security
 *
 * Este módulo:
 * - Es @Global, disponible en toda la aplicación
 * - Exporta SecurityConfigService
 * - Se carga antes que otros módulos de features
 */

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityConfigService } from './security-config.service';

@Global()
@Module({
  imports: [ConfigModule], // Necesario para inyectar ConfigService
  providers: [SecurityConfigService],
  exports: [SecurityConfigService],
})
export class SecurityConfigModule {}

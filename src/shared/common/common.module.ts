// src/shared/common/common.module.ts
import { Global, Module } from '@nestjs/common';
import { SanitizerService } from './sanitizer.service';
import { HandleErrorService } from './handle-error.service';

/**
 * CommonModule - Módulo compartido global
 *
 * Proporciona servicios de utilidad que pueden ser inyectados
 * en cualquier parte de la aplicación sin necesidad de importar
 * el módulo.
 *
 * Incluye:
 * - SanitizerService: Sanitización de datos de entrada
 * - HandleErrorService: Manejo centralizado de errores
 *
 * @example
 * ```typescript
 * // En cualquier service
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     private readonly sanitizer: SanitizerService,
 *     private readonly handleError: HandleErrorService,
 *   ) {}
 * }
 * ```
 */
@Global()
@Module({
  providers: [SanitizerService, HandleErrorService],
  exports: [SanitizerService, HandleErrorService],
})
export class CommonModule {}

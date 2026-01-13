/**
 * @module Queue
 * @description Barrel export del módulo Queue completo
 *
 * Exportaciones disponibles:
 * - QueueModule: Módulo principal (importar en app.module.ts)
 * - Producers: Para inyectar en otros módulos
 * - Service: Para gestión avanzada de colas
 * - DTOs: Para validaciones
 * - Interfaces: Para tipado
 * - Constants: Para configuración
 */

// Módulo principal
export * from './queue.module';

// Controller y Service
export * from './queue.controller';
export * from './queue.service';

// Producers (para inyectar en otros módulos)
export * from './producers';

// Processors (internos, pero disponibles)
export * from './processors';

// DTOs (para validaciones)
export * from './dto';

// Interfaces (para tipado)
export * from './interfaces';

// Constants (para configuración)
export * from './queue.constants';

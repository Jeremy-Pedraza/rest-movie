// src/modules/store/index.ts

/**
 * Barrel export para el módulo Store
 *
 * @description
 * Exporta todos los componentes públicos del módulo Store
 * para facilitar las importaciones en otros módulos.
 *
 * @example
 * ```typescript
 * import { StoreModule, StoreService, CreateStoreDto } from '@modules/store';
 * ```
 */

export * from './entities';
export * from './dto';
export * from './interfaces';
export * from './store.repository';
export * from './store.service';
export * from './store.controller';
export * from './store.module';

// src/modules/company/index.ts

/**
 * Barrel export para el módulo Company
 *
 * @description
 * Exporta todos los componentes públicos del módulo Company
 * para facilitar las importaciones en otros módulos.
 *
 * @example
 * ```typescript
 * import { CompanyModule, CompanyService, CreateCompanyDto } from '@modules/company';
 * ```
 */

export * from './entities';
export * from './dto';
export * from './interfaces';
export * from './company.repository';
export * from './company.service';
export * from './company.controller';
export * from './company.module';

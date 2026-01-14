// src/shared/database/index.ts

/**
 * @fileoverview Barrel export para módulo database
 * @module shared/database
 */

export * from './database.module';
export * from './transaction.service';
export * from './schema.context';
export * from './tenant-extractor.service';
export * from './base.repository';
export type { ITenantContext } from './schema.context';

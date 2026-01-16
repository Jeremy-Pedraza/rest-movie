// src/modules/store/store.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreEntity } from './entities';
import { StoreRepository } from './store.repository';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { CommonModule } from '@shared/common';
import { CompanyModule } from '@modules/company';
import { UserModule } from '@modules/user';

/**
 * StoreModule
 *
 * @description
 * Módulo completo para gestión de tiendas/sucursales.
 *
 * Características:
 * - CRUD completo de tiendas
 * - Relación con compañías (ManyToOne)
 * - Asignación de usuarios (ManyToMany)
 * - Filtros y búsquedas avanzadas
 * - Estadísticas globales
 * - Soft delete y restauración
 * - Activación/desactivación
 *
 * Dependencias:
 * - CommonModule: SanitizerService, HandleErrorService
 * - CompanyModule: Validar company_id
 * - UserModule: Validar user_ids
 * - TypeOrmModule: StoreEntity
 *
 * Exporta:
 * - StoreService: Para uso en otros módulos (ReportsModule)
 * - StoreRepository: Para uso en otros módulos
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([StoreEntity]),
    CommonModule,
    CompanyModule,
    UserModule,
  ],
  controllers: [StoreController],
  providers: [StoreRepository, StoreService],
  exports: [StoreService, StoreRepository],
})
export class StoreModule {}

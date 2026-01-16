// src/modules/company/company.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyEntity } from './entities';
import { CompanyRepository } from './company.repository';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { CommonModule } from '@shared/common';

/**
 * CompanyModule
 *
 * @description
 * Módulo completo para gestión de compañías.
 *
 * Características:
 * - CRUD completo de compañías
 * - Filtros y búsquedas avanzadas
 * - Estadísticas globales
 * - Soft delete y restauración
 * - Activación/desactivación
 *
 * Dependencias:
 * - CommonModule: SanitizerService, HandleErrorService
 * - TypeOrmModule: CompanyEntity
 *
 * Exporta:
 * - CompanyService: Para uso en otros módulos
 * - CompanyRepository: Para uso en otros módulos
 */
@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity]), CommonModule],
  controllers: [CompanyController],
  providers: [CompanyRepository, CompanyService],
  exports: [CompanyService, CompanyRepository],
})
export class CompanyModule {}

// src/modules/geography/geography.module.ts

/**
 * @fileoverview Módulo Geography para catálogo geográfico
 * @module modules/geography
 *
 * Proporciona un catálogo maestro de ubicaciones geográficas:
 * - Países (LATAM y Centroamérica)
 * - Departamentos/Estados/Provincias
 * - Ciudades principales
 *
 * Los endpoints son públicos (solo lectura) y no requieren autenticación.
 *
 * @version 1.0.0
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeoCountryEntity, GeoDepartmentEntity, GeoCityEntity } from './entities';
import { GeographyController } from './geography.controller';
import { GeographyService } from './geography.service';
import { GeographyRepository } from './geography.repository';

@Module({
  imports: [TypeOrmModule.forFeature([GeoCountryEntity, GeoDepartmentEntity, GeoCityEntity])],
  controllers: [GeographyController],
  providers: [GeographyService, GeographyRepository],
  exports: [GeographyService, GeographyRepository],
})
export class GeographyModule {}

// src/modules/reports/reports.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ReportHeaderEntity,
  SalesByOrderTypeEntity,
  PaymentMethodEntity,
  DynamicDiscountEntity,
  AdjustmentEntity,
  EffectiveOrderEntity,
} from './entities';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { CommonModule } from '@shared/common';
import { StoreModule } from '@modules/store';
import { CompanyModule } from '@modules/company';

/**
 * ReportsModule
 *
 * @description
 * Módulo completo para gestión de reportes de ventas multi-nivel.
 *
 * Características:
 * - CRUD completo de reportes
 * - Relación con tiendas (ManyToOne Store → Company)
 * - Entidades de detalle (ventas por tipo, métodos de pago, descuentos, ajustes, órdenes)
 * - Consolidaciones multi-nivel (tienda, compañía, global)
 * - Comparaciones temporales (períodos, YoY, MoM, días de semana)
 * - Comparaciones entre tiendas
 * - Rankings por métricas (ventas, órdenes, ticket promedio)
 * - Estadísticas y tendencias
 * - Control de acceso por roles (SUPER_ADMIN, ADMIN, MANAGER, USER)
 *
 * Entidades:
 * - ReportHeaderEntity: Reporte principal con métricas agregadas
 * - SalesByOrderTypeEntity: Desglose de ventas por tipo de orden
 * - PaymentMethodEntity: Desglose por método de pago
 * - DynamicDiscountEntity: Descuentos aplicados
 * - AdjustmentEntity: Ajustes realizados
 * - EffectiveOrderEntity: Órdenes individuales
 *
 * Dependencias:
 * - CommonModule: SanitizerService, HandleErrorService
 * - StoreModule: StoreRepository (validar acceso a tiendas)
 * - CompanyModule: CompanyRepository (validar acceso a compañías)
 * - TypeOrmModule: Todas las entidades de reportes
 *
 * Endpoints principales:
 * - POST   /reports                    - Crear reporte
 * - GET    /reports                    - Listar con filtros
 * - GET    /reports/:id                - Obtener por ID
 * - GET    /reports/:id/details        - Obtener con detalles
 * - PUT    /reports/:id                - Actualizar
 * - DELETE /reports/:id                - Eliminar
 * - POST   /reports/consolidate        - Consolidar reportes
 * - GET    /reports/consolidate/quick  - Consolidación rápida
 * - POST   /reports/compare            - Comparar reportes
 * - GET    /reports/compare/quick      - Comparación rápida
 * - POST   /reports/ranking/stores     - Ranking de tiendas
 * - POST   /reports/ranking/companies  - Ranking de compañías
 * - GET    /reports/ranking/quick      - Ranking rápido
 * - GET    /reports/stats/global       - Estadísticas globales
 * - GET    /reports/trends             - Tendencias
 * - GET    /reports/store/:storeId     - Reportes de una tienda
 * - GET    /reports/company/:companyId - Reportes de una compañía
 * - GET    /reports/company/:companyId/dashboard - Dashboard de compañía
 *
 * Exporta:
 * - ReportsService: Para uso en otros módulos
 * - ReportsRepository: Para uso en otros módulos
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReportHeaderEntity,
      SalesByOrderTypeEntity,
      PaymentMethodEntity,
      DynamicDiscountEntity,
      AdjustmentEntity,
      EffectiveOrderEntity,
    ]),
    CommonModule,
    StoreModule,
    CompanyModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsRepository, ReportsService],
  exports: [ReportsService, ReportsRepository],
})
export class ReportsModule {}

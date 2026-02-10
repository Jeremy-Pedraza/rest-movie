// src/modules/reports/dto/update-report.dto.ts

import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateReportDto } from './create-report.dto';

/**
 * DTO para actualizar un reporte
 *
 * @description
 * Extiende de CreateReportDto pero hace todos los campos opcionales.
 * No permite modificar store_id ni report_date (campos inmutables).
 *
 * @example
 * ```typescript
 * const dto: UpdateReportDto = {
 *   total_sales: 16000.00,
 *   status: 'archived',
 * };
 * ```
 */
export class UpdateReportDto extends PartialType(
  OmitType(CreateReportDto, ['store_id', 'report_date'] as const),
) {}

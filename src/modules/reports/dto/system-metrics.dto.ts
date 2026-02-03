// src/modules/reports/dto/system-metrics.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para métricas de CPU
 *
 * @description
 * Valida la información del CPU del agente que genera el reporte.
 */
export class CpuMetricsDto {
  @ApiProperty({
    description: 'Porcentaje de uso de CPU (0-100)',
    example: 45.5,
    minimum: 0,
  })
  @IsNumber({}, { message: 'usage debe ser un número' })
  @Min(0, { message: 'usage debe ser mayor o igual a 0' })
  @IsOptional()
  usage?: number;

  @ApiPropertyOptional({
    description: 'Número de núcleos del CPU',
    example: 4,
    minimum: 1,
  })
  @IsInt({ message: 'cores debe ser un número entero' })
  @Min(1, { message: 'cores debe ser mayor o igual a 1' })
  @IsOptional()
  cores?: number;

  @ApiPropertyOptional({
    description: 'Modelo del procesador',
    example: 'Intel Core i5-8250U',
  })
  @IsString({ message: 'model debe ser una cadena de texto' })
  @IsOptional()
  model?: string;
}

/**
 * DTO para métricas de memoria
 *
 * @description
 * Valida la información de memoria RAM del agente.
 * Los valores están en bytes.
 */
export class MemoryMetricsDto {
  @ApiProperty({
    description: 'Memoria total en bytes',
    example: 8589934592,
    minimum: 0,
  })
  @IsNumber({}, { message: 'total debe ser un número' })
  @Min(0, { message: 'total debe ser mayor o igual a 0' })
  @IsOptional()
  total?: number;

  @ApiProperty({
    description: 'Memoria usada en bytes',
    example: 4294967296,
    minimum: 0,
  })
  @IsNumber({}, { message: 'used debe ser un número' })
  @Min(0, { message: 'used debe ser mayor o igual a 0' })
  @IsOptional()
  used?: number;

  @ApiProperty({
    description: 'Memoria libre en bytes',
    example: 4294967296,
    minimum: 0,
  })
  @IsNumber({}, { message: 'free debe ser un número' })
  @Min(0, { message: 'free debe ser mayor o igual a 0' })
  @IsOptional()
  free?: number;

  @ApiPropertyOptional({
    description: 'Porcentaje de uso de memoria (0-100)',
    example: 50.0,
    minimum: 0,
  })
  @IsNumber({}, { message: 'percentUsed debe ser un número' })
  @Min(0, { message: 'percentUsed debe ser mayor o igual a 0' })
  @IsOptional()
  percentUsed?: number;
}

/**
 * DTO para métricas de disco
 *
 * @description
 * Valida la información de cada disco del agente.
 * Los valores de espacio están en bytes.
 */
export class DiskMetricsDto {
  @ApiProperty({
    description: 'Nombre o letra del disco',
    example: 'C:',
  })
  @IsString({ message: 'name debe ser una cadena de texto' })
  name: string;

  @ApiProperty({
    description: 'Espacio total en bytes',
    example: 500107862016,
    minimum: 0,
  })
  @IsNumber({}, { message: 'total debe ser un número' })
  @Min(0, { message: 'total debe ser mayor o igual a 0' })
  @IsOptional()
  total?: number;

  @ApiProperty({
    description: 'Espacio usado en bytes',
    example: 250053931008,
    minimum: 0,
  })
  @IsNumber({}, { message: 'used debe ser un número' })
  @Min(0, { message: 'used debe ser mayor o igual a 0' })
  @IsOptional()
  used?: number;

  @ApiProperty({
    description: 'Espacio libre en bytes',
    example: 250053931008,
    minimum: 0,
  })
  @IsNumber({}, { message: 'free debe ser un número' })
  @Min(0, { message: 'free debe ser mayor o igual a 0' })
  @IsOptional()
  free?: number;

  @ApiPropertyOptional({
    description: 'Porcentaje de uso del disco (0-100)',
    example: 50.0,
    minimum: 0,
  })
  @IsNumber({}, { message: 'percentUsed debe ser un número' })
  @Min(0, { message: 'percentUsed debe ser mayor o igual a 0' })
  @IsOptional()
  percentUsed?: number;

  @ApiPropertyOptional({
    description: 'Tipo de sistema de archivos',
    example: 'NTFS',
  })
  @IsString({ message: 'fileSystem debe ser una cadena de texto' })
  @IsOptional()
  fileSystem?: string;
}

/**
 * DTO para métricas de base de datos
 *
 * @description
 * Valida la información de cada base de datos del agente.
 */
export class DatabaseMetricsDto {
  @ApiProperty({
    description: 'Nombre de la base de datos',
    example: 'simphony_db',
  })
  @IsString({ message: 'name debe ser una cadena de texto' })
  name: string;

  @ApiPropertyOptional({
    description: 'Tamaño de la base de datos en bytes',
    example: 1073741824,
    minimum: 0,
  })
  @IsNumber({}, { message: 'size debe ser un número' })
  @Min(0, { message: 'size debe ser mayor o igual a 0' })
  @IsOptional()
  size?: number;

  @ApiPropertyOptional({
    description: 'Número de tablas en la base de datos',
    example: 45,
    minimum: 0,
  })
  @IsInt({ message: 'tables debe ser un número entero' })
  @Min(0, { message: 'tables debe ser mayor o igual a 0' })
  @IsOptional()
  tables?: number;

  @ApiPropertyOptional({
    description: 'Estado de la conexión a la base de datos',
    example: 'connected',
  })
  @IsString({ message: 'status debe ser una cadena de texto' })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Versión del motor de base de datos',
    example: 'Oracle 19c',
  })
  @IsString({ message: 'version debe ser una cadena de texto' })
  @IsOptional()
  version?: string;
}

/**
 * DTO para métricas del sistema
 *
 * @description
 * Valida la estructura completa de systemMetrics que envía el agente.
 * Incluye información de CPU, memoria, discos y bases de datos.
 *
 * @example
 * ```typescript
 * const metrics: SystemMetricsDto = {
 *   cpu: { usage: 45.5, cores: 4 },
 *   memory: { total: 8589934592, used: 4294967296, free: 4294967296 },
 *   disks: [{ name: 'C:', total: 500107862016, used: 250053931008, free: 250053931008 }],
 *   databases: [{ name: 'simphony_db', size: 1073741824, tables: 45 }],
 * };
 * ```
 */
export class SystemMetricsDto {
  @ApiPropertyOptional({
    description: 'Métricas del CPU',
    type: CpuMetricsDto,
  })
  @ValidateNested()
  @Type(() => CpuMetricsDto)
  @IsOptional()
  cpu?: CpuMetricsDto;

  @ApiPropertyOptional({
    description: 'Métricas de memoria RAM',
    type: MemoryMetricsDto,
  })
  @ValidateNested()
  @Type(() => MemoryMetricsDto)
  @IsOptional()
  memory?: MemoryMetricsDto;

  @ApiPropertyOptional({
    description: 'Métricas de discos',
    type: [DiskMetricsDto],
    isArray: true,
  })
  @IsArray({ message: 'disks debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => DiskMetricsDto)
  @IsOptional()
  disks?: DiskMetricsDto[];

  @ApiPropertyOptional({
    description: 'Métricas de bases de datos',
    type: [DatabaseMetricsDto],
    isArray: true,
  })
  @IsArray({ message: 'databases debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => DatabaseMetricsDto)
  @IsOptional()
  databases?: DatabaseMetricsDto[];
}

/**
 * DTO para metadata del reporte con validación de systemMetrics
 *
 * @description
 * Extiende la metadata básica del reporte con validación
 * de la estructura de systemMetrics.
 *
 * Campos adicionales permitidos:
 * - source: Origen del reporte (ej: 'agent', 'manual', 'import')
 * - version: Versión del agente que genera el reporte
 * - operator: Nombre del operador que ejecutó el agente
 * - timestamp: Timestamp de cuando se generó el reporte
 *
 * @example
 * ```typescript
 * const metadata: ReportMetadataDto = {
 *   source: 'agent',
 *   version: '2.1.0',
 *   operator: 'Juan Pérez',
 *   systemMetrics: {
 *     cpu: { usage: 45.5, cores: 4 },
 *     memory: { total: 8589934592, used: 4294967296 },
 *   },
 * };
 * ```
 */
export class ReportMetadataDto {
  @ApiPropertyOptional({
    description: 'Origen del reporte',
    example: 'agent',
  })
  @IsString({ message: 'source debe ser una cadena de texto' })
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({
    description: 'Versión del agente que genera el reporte',
    example: '2.1.0',
  })
  @IsString({ message: 'version debe ser una cadena de texto' })
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({
    description: 'Nombre del operador que ejecutó el agente',
    example: 'Juan Pérez',
  })
  @IsString({ message: 'operator debe ser una cadena de texto' })
  @IsOptional()
  operator?: string;

  @ApiPropertyOptional({
    description: 'Timestamp de generación del reporte',
    example: '2025-01-16T10:30:00Z',
  })
  @IsString({ message: 'timestamp debe ser una cadena de texto' })
  @IsOptional()
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Métricas del sistema del agente',
    type: SystemMetricsDto,
  })
  @ValidateNested()
  @Type(() => SystemMetricsDto)
  @IsOptional()
  systemMetrics?: SystemMetricsDto;
}

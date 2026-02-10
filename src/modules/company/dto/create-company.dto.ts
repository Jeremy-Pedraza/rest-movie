// src/modules/company/dto/create-company.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsBoolean,
  IsOptional,
  Length,
  IsObject,
  Matches,
  IsIn,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para configuración fiscal
 */
export class TaxConfigDto {
  @ApiProperty({
    description: 'Tasa de impuesto (ej: 0.18 para 18%)',
    example: 0.18,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber({}, { message: 'tax_rate debe ser un número' })
  @Min(0, { message: 'tax_rate no puede ser menor a 0' })
  @Max(1, { message: 'tax_rate no puede ser mayor a 1' })
  tax_rate: number;

  @ApiProperty({
    description: 'Nombre del impuesto',
    example: 'ITBIS',
  })
  @IsString({ message: 'tax_name debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'tax_name es requerido' })
  tax_name: string;

  @ApiProperty({
    description: 'Si el precio incluye impuesto por defecto',
    example: true,
  })
  @IsBoolean({ message: 'tax_included debe ser un valor booleano' })
  tax_included: boolean;
}

/**
 * Zonas horarias válidas para Centroamérica y Caribe
 */
const VALID_TIMEZONES = [
  'America/Santo_Domingo', // República Dominicana
  'America/Guatemala', // Guatemala
  'America/El_Salvador', // El Salvador
  'America/Tegucigalpa', // Honduras
  'America/Panama', // Panamá
  'America/Costa_Rica', // Costa Rica
  'America/Managua', // Nicaragua
  'America/Bogota', // Colombia
  'America/Mexico_City', // México
  'America/New_York', // USA Eastern
];

/**
 * Códigos de país ISO 3166-1 alpha-2 válidos
 */
const VALID_COUNTRY_CODES = ['DO', 'GT', 'SV', 'HN', 'PA', 'CR', 'NI', 'CO', 'MX', 'US'];

/**
 * Códigos de moneda ISO 4217 válidos
 */
const VALID_CURRENCY_CODES = [
  'DOP', // Peso Dominicano
  'GTQ', // Quetzal Guatemalteco
  'USD', // Dólar Estadounidense (El Salvador, Panamá)
  'HNL', // Lempira Hondureño
  'CRC', // Colón Costarricense
  'NIO', // Córdoba Nicaragüense
  'COP', // Peso Colombiano
  'MXN', // Peso Mexicano
];

/**
 * Formatos de fecha válidos
 */
const VALID_DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

/**
 * DTO para crear una compañía
 *
 * @description
 * Valida todos los campos requeridos para crear una nueva compañía en el sistema.
 * Incluye información básica, contacto, ubicación, configuración e internacionalización.
 *
 * @example
 * ```typescript
 * const dto: CreateCompanyDto = {
 *   name: 'Taco Bell República Dominicana',
 *   ruc: '101234567',
 *   email: 'admin@tacobell.do',
 *   pais: 'República Dominicana',
 *   ciudad: 'Santo Domingo',
 *   schema: 'taco_bell_rd',
 *   subdomain: 'tacobell-rd',
 *   country_code: 'DO',
 *   timezone: 'America/Santo_Domingo',
 *   currency_code: 'DOP',
 *   currency_symbol: 'RD$',
 *   date_format: 'DD/MM/YYYY',
 *   tax_config: { tax_rate: 0.18, tax_name: 'ITBIS', tax_included: true },
 * };
 * ```
 */
export class CreateCompanyDto {
  // ============================================
  // INFORMACIÓN BÁSICA
  // ============================================

  @ApiProperty({
    description: 'Nombre de la empresa/razón social',
    example: 'Taco Bell República Dominicana',
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Length(3, 255, { message: 'El nombre debe tener entre 3 y 255 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Schema de PostgreSQL (multi-tenant)',
    example: 'taco_bell_rd',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'El schema debe ser una cadena de texto' })
  @IsOptional()
  @Length(3, 100, { message: 'El schema debe tener entre 3 y 100 caracteres' })
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'El schema debe ser lowercase, sin espacios, comenzar con letra',
  })
  schema?: string;

  @ApiPropertyOptional({
    description: 'Dominio completo',
    example: 'tacobell-rd.mokka.com',
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: 'El dominio debe ser una cadena de texto' })
  @IsOptional()
  @Length(3, 255, { message: 'El dominio debe tener entre 3 y 255 caracteres' })
  domain?: string;

  @ApiPropertyOptional({
    description: 'Subdominio',
    example: 'tacobell-rd',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'El subdominio debe ser una cadena de texto' })
  @IsOptional()
  @Length(2, 50, { message: 'El subdominio debe tener entre 2 y 50 caracteres' })
  @Matches(/^[a-z][a-z0-9-]*$/, {
    message: 'El subdominio debe ser lowercase con guiones permitidos',
  })
  subdomain?: string;

  // ============================================
  // INFORMACIÓN FISCAL Y CONTACTO
  // ============================================

  @ApiProperty({
    description: 'RUC/NIT/RNC',
    example: '101234567',
    minLength: 5,
    maxLength: 100,
  })
  @IsString({ message: 'El RUC debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El RUC es requerido' })
  @Length(5, 100, { message: 'El RUC debe tener entre 5 y 100 caracteres' })
  ruc: string;

  @ApiProperty({
    description: 'Email corporativo',
    example: 'admin@tacobell.do',
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiPropertyOptional({
    description: 'Teléfono corporativo',
    example: '+1-809-555-1234',
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Dirección fiscal',
    example: 'Av. Abraham Lincoln 1001, Santo Domingo',
  })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsOptional()
  direccion?: string;

  @ApiProperty({
    description: 'País',
    example: 'República Dominicana',
  })
  @IsString({ message: 'El país debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El país es requerido' })
  pais: string;

  @ApiProperty({
    description: 'Ciudad',
    example: 'Santo Domingo',
  })
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La ciudad es requerida' })
  ciudad: string;

  // ============================================
  // INTERNACIONALIZACIÓN (FASE 1)
  // ============================================

  @ApiPropertyOptional({
    description: 'Zona horaria IANA',
    example: 'America/Santo_Domingo',
    enum: VALID_TIMEZONES,
    default: 'America/Santo_Domingo',
  })
  @IsString({ message: 'timezone debe ser una cadena de texto' })
  @IsOptional()
  @IsIn(VALID_TIMEZONES, {
    message: `timezone debe ser uno de: ${VALID_TIMEZONES.join(', ')}`,
  })
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Código ISO 3166-1 alpha-2 del país',
    example: 'DO',
    enum: VALID_COUNTRY_CODES,
    default: 'DO',
    minLength: 2,
    maxLength: 2,
  })
  @IsString({ message: 'country_code debe ser una cadena de texto' })
  @IsOptional()
  @Length(2, 2, { message: 'country_code debe tener exactamente 2 caracteres' })
  @IsIn(VALID_COUNTRY_CODES, {
    message: `country_code debe ser uno de: ${VALID_COUNTRY_CODES.join(', ')}`,
  })
  country_code?: string;

  @ApiPropertyOptional({
    description: 'Departamento/Estado/Provincia',
    example: 'Distrito Nacional',
  })
  @IsString({ message: 'departamento debe ser una cadena de texto' })
  @IsOptional()
  @Length(2, 100, { message: 'departamento debe tener entre 2 y 100 caracteres' })
  departamento?: string;

  @ApiPropertyOptional({
    description: 'Código ISO 4217 de moneda',
    example: 'DOP',
    enum: VALID_CURRENCY_CODES,
    default: 'DOP',
  })
  @IsString({ message: 'currency_code debe ser una cadena de texto' })
  @IsOptional()
  @Length(3, 3, { message: 'currency_code debe tener exactamente 3 caracteres' })
  @IsIn(VALID_CURRENCY_CODES, {
    message: `currency_code debe ser uno de: ${VALID_CURRENCY_CODES.join(', ')}`,
  })
  currency_code?: string;

  @ApiPropertyOptional({
    description: 'Símbolo de moneda',
    example: 'RD$',
    default: 'RD$',
  })
  @IsString({ message: 'currency_symbol debe ser una cadena de texto' })
  @IsOptional()
  @Length(1, 10, { message: 'currency_symbol debe tener entre 1 y 10 caracteres' })
  currency_symbol?: string;

  @ApiPropertyOptional({
    description: 'Formato de fecha',
    example: 'DD/MM/YYYY',
    enum: VALID_DATE_FORMATS,
    default: 'DD/MM/YYYY',
  })
  @IsString({ message: 'date_format debe ser una cadena de texto' })
  @IsOptional()
  @IsIn(VALID_DATE_FORMATS, {
    message: `date_format debe ser uno de: ${VALID_DATE_FORMATS.join(', ')}`,
  })
  date_format?: string;

  @ApiPropertyOptional({
    description: 'Configuración fiscal',
    example: { tax_rate: 0.18, tax_name: 'ITBIS', tax_included: true },
    type: TaxConfigDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TaxConfigDto)
  tax_config?: TaxConfigDto;

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  @ApiPropertyOptional({
    description: 'Estado activo/inactivo',
    default: true,
  })
  @IsBoolean({ message: 'is_active debe ser un valor booleano' })
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Plan/Tier',
    example: 'premium',
  })
  @IsString({ message: 'El plan debe ser una cadena de texto' })
  @IsOptional()
  plan?: string;

  @ApiPropertyOptional({
    description: 'Configuración adicional (JSON)',
    example: { features: ['reports', 'analytics'], max_users: 100 },
  })
  @IsObject({ message: 'Settings debe ser un objeto JSON' })
  @IsOptional()
  settings?: Record<string, any>;
}

// ============================================
// CONSTANTES EXPORTADAS (para reutilizar)
// ============================================

export { VALID_TIMEZONES, VALID_COUNTRY_CODES, VALID_CURRENCY_CODES, VALID_DATE_FORMATS };

import { SanitizerService } from '@shared/common';
import { CreateCompanyDto, UpdateCompanyDto } from '../dto';
import { CompanyEntity } from '../entities';

/**
 * Sanitiza datos para creación de compañía.
 */
export function sanitizeCreateCompanyDto(
  sanitizer: SanitizerService,
  dto: CreateCompanyDto,
): Partial<CompanyEntity> {
  return {
    name: sanitizer.sanitizeString(dto.name),
    schema: dto.schema ? sanitizer.sanitizeString(dto.schema).toLowerCase() : undefined,
    domain: dto.domain ? sanitizer.sanitizeString(dto.domain) : undefined,
    subdomain: dto.subdomain ? sanitizer.sanitizeString(dto.subdomain) : undefined,
    email: sanitizer.sanitizeEmail(dto.email),
    telefono: dto.telefono ? sanitizer.sanitizeString(dto.telefono) : undefined,
    direccion: dto.direccion ? sanitizer.sanitizeString(dto.direccion) : undefined,
    pais: sanitizer.sanitizeString(dto.pais),
    ciudad: sanitizer.sanitizeString(dto.ciudad),
    ruc: sanitizer.sanitizeString(dto.ruc).toUpperCase(),
    is_active: dto.is_active ?? true,
    plan: dto.plan ? sanitizer.sanitizeString(dto.plan) : undefined,
    settings: dto.settings,
    timezone: dto.timezone || 'America/Santo_Domingo',
    country_code: dto.country_code || 'DO',
    departamento: dto.departamento ? sanitizer.sanitizeString(dto.departamento) : undefined,
    currency_code: dto.currency_code || 'DOP',
    currency_symbol: dto.currency_symbol || 'RD$',
    date_format: dto.date_format || 'DD/MM/YYYY',
    tax_config: dto.tax_config || undefined,
  };
}

/**
 * Sanitiza datos para actualización parcial de compañía.
 */
export function sanitizeUpdateCompanyDto(
  sanitizer: SanitizerService,
  dto: UpdateCompanyDto,
): Partial<CompanyEntity> {
  const sanitized: Partial<CompanyEntity> = {};

  if (dto.name) sanitized.name = sanitizer.sanitizeString(dto.name);
  if (dto.domain) sanitized.domain = sanitizer.sanitizeString(dto.domain);
  if (dto.subdomain) sanitized.subdomain = sanitizer.sanitizeString(dto.subdomain);
  if (dto.email) sanitized.email = sanitizer.sanitizeEmail(dto.email);
  if (dto.telefono) sanitized.telefono = sanitizer.sanitizeString(dto.telefono);
  if (dto.direccion) sanitized.direccion = sanitizer.sanitizeString(dto.direccion);
  if (dto.pais) sanitized.pais = sanitizer.sanitizeString(dto.pais);
  if (dto.ciudad) sanitized.ciudad = sanitizer.sanitizeString(dto.ciudad);
  if (dto.ruc) sanitized.ruc = sanitizer.sanitizeString(dto.ruc).toUpperCase();
  if (dto.is_active !== undefined) sanitized.is_active = dto.is_active;
  if (dto.plan) sanitized.plan = sanitizer.sanitizeString(dto.plan);
  if (dto.settings) sanitized.settings = dto.settings;

  if (dto.timezone) sanitized.timezone = dto.timezone;
  if (dto.country_code) sanitized.country_code = dto.country_code;
  if (dto.departamento) sanitized.departamento = sanitizer.sanitizeString(dto.departamento);
  if (dto.currency_code) sanitized.currency_code = dto.currency_code;
  if (dto.currency_symbol) sanitized.currency_symbol = dto.currency_symbol;
  if (dto.date_format) sanitized.date_format = dto.date_format;
  if (dto.tax_config) sanitized.tax_config = dto.tax_config;

  return sanitized;
}

// src/constants/company.constant.ts

/**
 * @fileoverview Constantes de negocio para company (validaciones de i18n)
 * @module constants
 *
 * Datos de referencia reutilizables: zonas horarias, países, monedas y formatos.
 * Usados en DTOs de company y potencialmente en otros módulos.
 */

/** Zonas horarias válidas para Centroamérica y Caribe */
export const VALID_TIMEZONES = [
  'America/Santo_Domingo',
  'America/Guatemala',
  'America/El_Salvador',
  'America/Tegucigalpa',
  'America/Panama',
  'America/Costa_Rica',
  'America/Managua',
  'America/Bogota',
  'America/Mexico_City',
  'America/New_York',
] as const;

/** Códigos de país ISO 3166-1 alpha-2 válidos */
export const VALID_COUNTRY_CODES = [
  'DO',
  'GT',
  'SV',
  'HN',
  'PA',
  'CR',
  'NI',
  'CO',
  'MX',
  'US',
] as const;

/** Códigos de moneda ISO 4217 válidos */
export const VALID_CURRENCY_CODES = [
  'DOP',
  'GTQ',
  'USD',
  'HNL',
  'CRC',
  'NIO',
  'COP',
  'MXN',
] as const;

/** Formatos de fecha válidos */
export const VALID_DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const;

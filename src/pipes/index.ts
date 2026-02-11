/**
 * @fileoverview Barrel export para pipes custom.
 *
 * Pipes activos (con nombre propio para evitar colisión con built-ins):
 * - StrictParseIntPipe, StrictParsePositiveIntPipe, StrictParseOptionalIntPipe
 * - StrictParseUUIDPipe
 *
 * Pipes deprecados (mantienen alias por compatibilidad):
 * - ParseIntPipe → usar StrictParseIntPipe
 * - ParsePositiveIntPipe → usar StrictParsePositiveIntPipe
 * - ParseOptionalIntPipe → usar StrictParseOptionalIntPipe
 * - ParseUUIDPipe → usar StrictParseUUIDPipe o el built-in de @nestjs/common
 * - CustomValidationPipe → usar ValidationPipe global de @nestjs/common
 */
export * from './validation.pipe';
export * from './parse-uuid.pipe';
export * from './parse-int.pipe';

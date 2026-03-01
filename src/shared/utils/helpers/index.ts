// src/shared/utils/helpers/index.ts

/**
 * @fileoverview Barrel export para todos los helpers
 * @module shared/utils/helpers
 *
 * NOTA: Algunas funciones tienen el mismo nombre en diferentes helpers.
 * Se resuelven los conflictos usando exports explícitos.
 */

// ============================================
// STRING HELPERS
// ============================================
export {
  slugify,
  capitalize,
  titleCase,
  toCamelCase,
  toSnakeCase,
  toKebabCase,
  truncate,
  cleanSpaces,
  removeSpecialChars,
  isEmpty as isEmptyString,
  isNotEmpty as isNotEmptyString,
  randomString,
  mask,
  maskEmail,
  maskPhone,
  extractNumbers,
  extractLetters,
  wordCount,
  reverse,
  isPalindrome,
  escapeHtml,
  unescapeHtml,
  removeAccents,
  formatCurrency,
  formatNumber,
  getInitials,
  normalizeForSearch,
  containsIgnoreCase,
} from './string.helper';

// ============================================
// DATE HELPERS
// ============================================
export {
  DATE_FORMATS,
  parseDate,
  formatDate,
  formatDateDisplay,
  formatDateTime,
  formatDateLong,
  formatTime,
  toISOString,
  toDBFormat,
  now,
  today,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addTime,
  subtractTime,
  addDays,
  addMonths,
  addYears,
  addHours,
  addMinutes,
  isToday,
  isYesterday,
  isBefore,
  isAfter,
  isBetween,
  isSameDay,
  isPast,
  isFuture,
  isWeekend,
  isWeekday,
  diff,
  daysBetween,
  monthsBetween,
  yearsBetween,
  calculateAge,
  timeAgo,
  timeUntil,
  timeBetween,
  dateRange,
  workdaysInRange,
  getYear,
  getMonth,
  getDay,
  getDayOfWeek,
  getDayName,
  getMonthName,
  getWeekOfYear,
  getQuarter,
  isValidDate as isValidDateFormat,
  daysInMonth,
  isLeapYear,
  toUnixTimestamp,
  fromUnixTimestamp,
  formatDuration,
  getNextDayOfWeek,
  combineDateAndTime,
} from './date.helper';

// ============================================
// CRYPTO HELPERS
// ============================================
export {
  sha256,
  sha512,
  md5,
  hmacSha256,
  hmacSha512,
  encrypt,
  decrypt,
  encryptToString,
  decryptFromString,
  randomBytes,
  generateToken,
  generateBase64Token,
  generateNumericCode,
  generateAlphanumericCode,
  generateUUID,
  generateUUIDv7,
  generateSalt,
  secureCompare,
  secureCompareBuffers,
  deriveKey,
  deriveKeySync,
  hashBuffer,
  checksumMD5,
  checksumSHA256,
  toBase64,
  fromBase64,
  toBase64Url,
  fromBase64Url,
  toHex,
  fromHex,
  sign,
  verifySignature,
  createSignedToken,
  verifySignedToken,
} from './crypto.helper';

export type { EncryptionResult } from './crypto.helper';

// ============================================
// VALIDATION HELPERS
// ============================================
export {
  REGEX,
  isEmail,
  isURL,
  isPhone,
  isUUID,
  isSlug,
  isNumeric,
  isAlpha,
  isAlphanumeric,
  isHexColor,
  isIPv4,
  isIPv6,
  isJWT,
  isBase64,
  isMongoId,
  validatePassword,
  isStrongPassword,
  isValidNIT,
  isValidCedula,
  isValidCreditCard,
  detectCardType,
  isISODate,
  isISODateTime,
  isValidDate,
  isAdult,
  isNullOrUndefined,
  isObject,
  isArray,
  isFiniteNumber,
  isInteger,
  isPositive,
  isNegative,
  isEmpty,
  isNotEmpty,
  isEmptyArray,
  isEmptyObject,
  isInRange,
  isLengthInRange,
  validate,
  required,
  emailValidator,
  minLength,
  maxLength,
  compose,
} from './validation.helper';

export type { PasswordValidationResult, ValidationResult } from './validation.helper';

// ============================================
// ROLE HELPERS
// ============================================
export { hasRole, hasAnyRole, hasAllRoles } from './role.helper';

// ============================================
// TRANSFORM HELPERS
// ============================================
export { toBoolean } from './transform.helper';

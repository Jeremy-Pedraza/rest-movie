// src/shared/utils/helpers/crypto.helper.ts

/**
 * @fileoverview Utilidades criptogrÃ¡ficas para hash, encriptaciÃ³n y tokens
 * @module shared/utils/helpers/crypto
 */

import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

// ============================================
// CONFIGURACIÃ“N
// ============================================

const BCRYPT_ROUNDS = 10;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;

// ============================================
// FUNCIONES DE HASH (BCRYPT)
// ============================================

/**
 * Genera un hash bcrypt para un texto (ideal para passwords)
 * @param plainText - Texto a hashear
 * @param rounds - NÃºmero de rondas (default: 10)
 * @returns Hash bcrypt
 * @example
 * const hash = await hashPassword('mypassword123')
 */
export async function hashPassword(
  plainText: string,
  rounds: number = BCRYPT_ROUNDS,
): Promise<string> {
  return bcrypt.hash(plainText, rounds);
}

/**
 * Verifica si un texto coincide con un hash bcrypt
 * @param plainText - Texto plano
 * @param hash - Hash a comparar
 * @returns true si coinciden
 * @example
 * const isValid = await verifyPassword('mypassword123', hash)
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Genera un hash bcrypt de forma sÃ­ncrona (usar solo si es necesario)
 * @param plainText - Texto a hashear
 * @param rounds - NÃºmero de rondas
 * @returns Hash bcrypt
 */
export function hashPasswordSync(plainText: string, rounds: number = BCRYPT_ROUNDS): string {
  return bcrypt.hashSync(plainText, rounds);
}

/**
 * Verifica password de forma sÃ­ncrona
 * @param plainText - Texto plano
 * @param hash - Hash a comparar
 * @returns true si coinciden
 */
export function verifyPasswordSync(plainText: string, hash: string): boolean {
  return bcrypt.compareSync(plainText, hash);
}

// ============================================
// FUNCIONES DE HASH (CRYPTO)
// ============================================

/**
 * Genera un hash SHA-256
 * @param data - Datos a hashear
 * @returns Hash en hexadecimal
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Genera un hash SHA-512
 * @param data - Datos a hashear
 * @returns Hash en hexadecimal
 */
export function sha512(data: string): string {
  return crypto.createHash('sha512').update(data).digest('hex');
}

/**
 * Genera un hash MD5 (NO usar para passwords)
 * @param data - Datos a hashear
 * @returns Hash en hexadecimal
 */
export function md5(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Genera un HMAC-SHA256
 * @param data - Datos a firmar
 * @param secret - Clave secreta
 * @returns HMAC en hexadecimal
 */
export function hmacSha256(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Genera un HMAC-SHA512
 * @param data - Datos a firmar
 * @param secret - Clave secreta
 * @returns HMAC en hexadecimal
 */
export function hmacSha512(data: string, secret: string): string {
  return crypto.createHmac('sha512', secret).update(data).digest('hex');
}

// ============================================
// FUNCIONES DE ENCRIPTACIÃ“N SIMÃ‰TRICA
// ============================================

/**
 * Resultado de una encriptaciÃ³n
 */
export interface EncryptionResult {
  encrypted: string;
  iv: string;
  authTag: string;
}

/**
 * Encripta datos usando AES-256-GCM
 * @param plainText - Texto a encriptar
 * @param secretKey - Clave secreta (32 bytes / 64 caracteres hex)
 * @returns Objeto con datos encriptados
 * @example
 * const result = encrypt('sensitive data', secretKey)
 * // { encrypted: '...', iv: '...', authTag: '...' }
 */
export function encrypt(plainText: string, secretKey: string): EncryptionResult {
  // Asegurar que la clave tenga 32 bytes
  const key = Buffer.from(sha256(secretKey).substring(0, 64), 'hex');

  // Generar IV aleatorio
  const iv = crypto.randomBytes(IV_LENGTH);

  // Crear cipher
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  // Encriptar
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Obtener auth tag
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Desencripta datos encriptados con AES-256-GCM
 * @param encryptedData - Objeto con datos encriptados
 * @param secretKey - Clave secreta
 * @returns Texto desencriptado
 */
export function decrypt(encryptedData: EncryptionResult, secretKey: string): string {
  const key = Buffer.from(sha256(secretKey).substring(0, 64), 'hex');

  const iv = Buffer.from(encryptedData.iv, 'hex');
  const authTag = Buffer.from(encryptedData.authTag, 'hex');

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encripta y devuelve un string Ãºnico (para almacenar en DB)
 * @param plainText - Texto a encriptar
 * @param secretKey - Clave secreta
 * @returns String encriptado completo
 */
export function encryptToString(plainText: string, secretKey: string): string {
  const result = encrypt(plainText, secretKey);
  return `${result.iv}:${result.authTag}:${result.encrypted}`;
}

/**
 * Desencripta un string encriptado con encryptToString
 * @param encryptedString - String encriptado
 * @param secretKey - Clave secreta
 * @returns Texto desencriptado
 */
export function decryptFromString(encryptedString: string, secretKey: string): string {
  const [iv, authTag, encrypted] = encryptedString.split(':');
  return decrypt({ iv, authTag, encrypted }, secretKey);
}

// ============================================
// GENERACIÃ“N DE TOKENS Y STRINGS ALEATORIOS
// ============================================

/**
 * Genera bytes aleatorios seguros
 * @param length - Longitud en bytes
 * @returns Buffer con bytes aleatorios
 */
export function randomBytes(length: number): Buffer {
  return crypto.randomBytes(length);
}

/**
 * Genera un token hexadecimal aleatorio
 * @param length - Longitud en bytes (el resultado serÃ¡ el doble en caracteres)
 * @returns Token hexadecimal
 * @example
 * generateToken(32) // '64 caracteres hexadecimales'
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Genera un token base64 URL-safe
 * @param length - Longitud en bytes
 * @returns Token base64url
 */
export function generateBase64Token(length: number = 32): string {
  return crypto
    .randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Genera un cÃ³digo numÃ©rico aleatorio (para OTP, verificaciÃ³n)
 * @param digits - NÃºmero de dÃ­gitos
 * @returns CÃ³digo numÃ©rico
 * @example
 * generateNumericCode(6) // '123456'
 */
export function generateNumericCode(digits: number = 6): string {
  const max = Math.pow(10, digits);
  const min = Math.pow(10, digits - 1);
  const randomNumber = crypto.randomInt(min, max);
  return randomNumber.toString();
}

/**
 * Genera un cÃ³digo alfanumÃ©rico aleatorio
 * @param length - Longitud del cÃ³digo
 * @param options - Opciones de generaciÃ³n
 * @returns CÃ³digo alfanumÃ©rico
 */
export function generateAlphanumericCode(
  length: number = 8,
  options: {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    excludeAmbiguous?: boolean;
  } = {},
): string {
  const { uppercase = true, lowercase = true, numbers = true, excludeAmbiguous = true } = options;

  let chars = '';
  if (uppercase) {
    chars += excludeAmbiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  if (lowercase) {
    chars += excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  }
  if (numbers) {
    chars += excludeAmbiguous ? '23456789' : '0123456789';
  }

  let result = '';
  const randomBytesArray = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    result += chars[randomBytesArray[i] % chars.length];
  }

  return result;
}

/**
 * Genera un UUID v4
 * @returns UUID v4
 * @example
 * generateUUID() // '550e8400-e29b-41d4-a716-446655440000'
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Genera un UUID v7 (timestamp-based, ordenable)
 * @returns UUID v7
 */
export function generateUUIDv7(): string {
  const timestamp = Date.now();
  const timestampHex = timestamp.toString(16).padStart(12, '0');

  const randomPart = crypto.randomBytes(10).toString('hex');

  // Formato: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
  const uuid = [
    timestampHex.slice(0, 8),
    timestampHex.slice(8, 12),
    '7' + randomPart.slice(0, 3),
    ((parseInt(randomPart.slice(3, 4), 16) & 0x3) | 0x8).toString(16) + randomPart.slice(4, 7),
    randomPart.slice(7, 19),
  ].join('-');

  return uuid;
}

/**
 * Genera un salt aleatorio
 * @param length - Longitud en bytes
 * @returns Salt en hexadecimal
 */
export function generateSalt(length: number = SALT_LENGTH): string {
  return crypto.randomBytes(length).toString('hex');
}

// ============================================
// FUNCIONES DE COMPARACIÃ“N SEGURA
// ============================================

/**
 * Compara dos strings de forma segura (timing-safe)
 * @param a - Primer string
 * @param b - Segundo string
 * @returns true si son iguales
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Compara dos buffers de forma segura
 * @param a - Primer buffer
 * @param b - Segundo buffer
 * @returns true si son iguales
 */
export function secureCompareBuffers(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

// ============================================
// FUNCIONES DE DERIVACIÃ“N DE CLAVES
// ============================================

/**
 * Deriva una clave usando PBKDF2
 * @param password - Password base
 * @param salt - Salt
 * @param iterations - Iteraciones (default: 100000)
 * @param keyLength - Longitud de clave en bytes
 * @param digest - Algoritmo de hash
 * @returns Clave derivada en hexadecimal
 */
export async function deriveKey(
  password: string,
  salt: string,
  iterations: number = 100000,
  keyLength: number = 32,
  digest: string = 'sha512',
): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keyLength, digest, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
}

/**
 * Deriva una clave de forma sÃ­ncrona
 */
export function deriveKeySync(
  password: string,
  salt: string,
  iterations: number = 100000,
  keyLength: number = 32,
  digest: string = 'sha512',
): string {
  return crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest).toString('hex');
}

// ============================================
// FUNCIONES DE HASH DE ARCHIVOS
// ============================================

/**
 * Calcula el hash de un buffer (para archivos)
 * @param buffer - Buffer del archivo
 * @param algorithm - Algoritmo de hash
 * @returns Hash en hexadecimal
 */
export function hashBuffer(buffer: Buffer, algorithm: string = 'sha256'): string {
  return crypto.createHash(algorithm).update(buffer).digest('hex');
}

/**
 * Calcula el checksum MD5 de un buffer
 * @param buffer - Buffer
 * @returns MD5 checksum
 */
export function checksumMD5(buffer: Buffer): string {
  return hashBuffer(buffer, 'md5');
}

/**
 * Calcula el checksum SHA-256 de un buffer
 * @param buffer - Buffer
 * @returns SHA-256 checksum
 */
export function checksumSHA256(buffer: Buffer): string {
  return hashBuffer(buffer, 'sha256');
}

// ============================================
// FUNCIONES DE ENCODING/DECODING
// ============================================

/**
 * Convierte string a Base64
 * @param text - Texto a codificar
 * @returns String en Base64
 */
export function toBase64(text: string): string {
  return Buffer.from(text, 'utf-8').toString('base64');
}

/**
 * Decodifica Base64 a string
 * @param base64 - String en Base64
 * @returns Texto decodificado
 */
export function fromBase64(base64: string): string {
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Convierte string a Base64 URL-safe
 * @param text - Texto a codificar
 * @returns String en Base64url
 */
export function toBase64Url(text: string): string {
  return Buffer.from(text, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decodifica Base64 URL-safe a string
 * @param base64url - String en Base64url
 * @returns Texto decodificado
 */
export function fromBase64Url(base64url: string): string {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '=');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Convierte string a hexadecimal
 * @param text - Texto a codificar
 * @returns String en hexadecimal
 */
export function toHex(text: string): string {
  return Buffer.from(text, 'utf-8').toString('hex');
}

/**
 * Decodifica hexadecimal a string
 * @param hex - String en hexadecimal
 * @returns Texto decodificado
 */
export function fromHex(hex: string): string {
  return Buffer.from(hex, 'hex').toString('utf-8');
}

// ============================================
// FUNCIONES DE FIRMA
// ============================================

/**
 * Firma datos con HMAC-SHA256
 * @param data - Datos a firmar
 * @param secret - Clave secreta
 * @returns Firma en base64url
 */
export function sign(data: string, secret: string): string {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return signature;
}

/**
 * Verifica una firma HMAC-SHA256
 * @param data - Datos originales
 * @param signature - Firma a verificar
 * @param secret - Clave secreta
 * @returns true si la firma es vÃ¡lida
 */
export function verifySignature(data: string, signature: string, secret: string): boolean {
  const expectedSignature = sign(data, secret);
  return secureCompare(signature, expectedSignature);
}

/**
 * Crea un token firmado (data + signature)
 * @param data - Datos a incluir
 * @param secret - Clave secreta
 * @returns Token firmado
 */
export function createSignedToken(data: object, secret: string): string {
  const payload = toBase64Url(JSON.stringify(data));
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

/**
 * Verifica y extrae datos de un token firmado
 * @param token - Token firmado
 * @param secret - Clave secreta
 * @returns Datos del token o null si es invÃ¡lido
 */
export function verifySignedToken<T = object>(token: string, secret: string): T | null {
  const [payload, signature] = token.split('.');

  if (!payload || !signature) {
    return null;
  }

  if (!verifySignature(payload, signature, secret)) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(payload)) as T;
  } catch {
    return null;
  }
}

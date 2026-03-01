// src/shared/utils/helpers/crypto.helper.ts

import * as crypto from 'crypto';

// ============================================
// CONFIGURATION
// ============================================

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;

// ============================================
// HASH FUNCTIONS (CRYPTO)
// ============================================

export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function sha512(data: string): string {
  return crypto.createHash('sha512').update(data).digest('hex');
}

export function md5(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

export function hmacSha256(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

export function hmacSha512(data: string, secret: string): string {
  return crypto.createHmac('sha512', secret).update(data).digest('hex');
}

// ============================================
// SYMMETRIC ENCRYPTION
// ============================================

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  authTag: string;
}

export function encrypt(plainText: string, secretKey: string): EncryptionResult {
  const key = Buffer.from(sha256(secretKey).substring(0, 64), 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

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

export function encryptToString(plainText: string, secretKey: string): string {
  const result = encrypt(plainText, secretKey);
  return `${result.iv}:${result.authTag}:${result.encrypted}`;
}

export function decryptFromString(encryptedString: string, secretKey: string): string {
  const [iv, authTag, encrypted] = encryptedString.split(':');
  return decrypt({ iv, authTag, encrypted }, secretKey);
}

// ============================================
// TOKEN GENERATION
// ============================================

export function randomBytes(length: number): Buffer {
  return crypto.randomBytes(length);
}

export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateBase64Token(length: number = 32): string {
  return crypto
    .randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generateNumericCode(digits: number = 6): string {
  const max = Math.pow(10, digits);
  const min = Math.pow(10, digits - 1);
  const randomNumber = crypto.randomInt(min, max);
  return randomNumber.toString();
}

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

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function generateUUIDv7(): string {
  const timestamp = Date.now();
  const timestampHex = timestamp.toString(16).padStart(12, '0');
  const randomPart = crypto.randomBytes(10).toString('hex');

  const uuid = [
    timestampHex.slice(0, 8),
    timestampHex.slice(8, 12),
    '7' + randomPart.slice(0, 3),
    ((parseInt(randomPart.slice(3, 4), 16) & 0x3) | 0x8).toString(16) + randomPart.slice(4, 7),
    randomPart.slice(7, 19),
  ].join('-');

  return uuid;
}

export function generateSalt(length: number = SALT_LENGTH): string {
  return crypto.randomBytes(length).toString('hex');
}

// ============================================
// SECURE COMPARISON
// ============================================

export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function secureCompareBuffers(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

// ============================================
// KEY DERIVATION
// ============================================

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
// FILE HASHING
// ============================================

export function hashBuffer(buffer: Buffer, algorithm: string = 'sha256'): string {
  return crypto.createHash(algorithm).update(buffer).digest('hex');
}

export function checksumMD5(buffer: Buffer): string {
  return hashBuffer(buffer, 'md5');
}

export function checksumSHA256(buffer: Buffer): string {
  return hashBuffer(buffer, 'sha256');
}

// ============================================
// ENCODING/DECODING
// ============================================

export function toBase64(text: string): string {
  return Buffer.from(text, 'utf-8').toString('base64');
}

export function fromBase64(base64: string): string {
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export function toBase64Url(text: string): string {
  return Buffer.from(text, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function fromBase64Url(base64url: string): string {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '=');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export function toHex(text: string): string {
  return Buffer.from(text, 'utf-8').toString('hex');
}

export function fromHex(hex: string): string {
  return Buffer.from(hex, 'hex').toString('utf-8');
}

// ============================================
// SIGNING
// ============================================

export function sign(data: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function verifySignature(data: string, signature: string, secret: string): boolean {
  const expectedSignature = sign(data, secret);
  return secureCompare(signature, expectedSignature);
}

export function createSignedToken(data: object, secret: string): string {
  const payload = toBase64Url(JSON.stringify(data));
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

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

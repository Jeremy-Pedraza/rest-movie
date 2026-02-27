import { SanitizerService } from '@shared/common';
import { CreateUserDto, UpdateUserDto } from '../dto';

type UserProfileUpdateDto = Pick<
  UpdateUserDto,
  'firstName' | 'lastName' | 'phone' | 'avatar' | 'preferences'
>;

/**
 * Sanitiza datos para creación de usuario.
 */
export function sanitizeCreateUserDto(
  sanitizer: SanitizerService,
  dto: CreateUserDto,
): CreateUserDto {
  return {
    ...dto,
    email: sanitizer.sanitizeEmail(dto.email),
    firstName: sanitizer.sanitizeString(dto.firstName),
    lastName: sanitizer.sanitizeString(dto.lastName),
    phone: dto.phone ? sanitizer.sanitizePhone(dto.phone) : undefined,
  };
}

/**
 * Sanitiza datos para actualización parcial de usuario.
 */
export function sanitizeUpdateUserDto(
  sanitizer: SanitizerService,
  dto: UpdateUserDto,
): UpdateUserDto {
  const sanitized: UpdateUserDto = { ...dto };

  if (dto.email) {
    sanitized.email = sanitizer.sanitizeEmail(dto.email);
  }
  if (dto.firstName) {
    sanitized.firstName = sanitizer.sanitizeString(dto.firstName);
  }
  if (dto.lastName) {
    sanitized.lastName = sanitizer.sanitizeString(dto.lastName);
  }
  if (dto.phone) {
    sanitized.phone = sanitizer.sanitizePhone(dto.phone);
  }

  return sanitized;
}

/**
 * Sanitiza datos de actualización de perfil.
 */
export function sanitizeUserProfileDto(
  sanitizer: SanitizerService,
  dto: UserProfileUpdateDto,
): UserProfileUpdateDto {
  return {
    ...dto,
    firstName: dto.firstName ? sanitizer.sanitizeString(dto.firstName) : undefined,
    lastName: dto.lastName ? sanitizer.sanitizeString(dto.lastName) : undefined,
    phone: dto.phone ? sanitizer.sanitizePhone(dto.phone) : undefined,
  };
}

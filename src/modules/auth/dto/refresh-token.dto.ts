// src/modules/auth/dto/refresh-token.dto.ts

/**
 * @fileoverview DTO para refresh token
 * @module modules/auth/dto
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsJWT } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token válido',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'El refresh token debe ser texto' })
  @IsNotEmpty({ message: 'El refresh token es requerido' })
  @IsJWT({ message: 'El refresh token debe ser un JWT válido' })
  refreshToken: string;
}

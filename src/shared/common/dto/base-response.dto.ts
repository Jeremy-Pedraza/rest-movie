// src/shared/common/dto/base-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * BaseResponseDto - DTO base para respuestas de la API
 *
 * Usado para documentación de Swagger.
 *
 * @example Success Response
 * ```json
 * {
 *   "success": true,
 *   "data": { ... },
 *   "message": "Operación exitosa"
 * }
 * ```
 */
export class BaseResponseDto<T = any> {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'Datos de la respuesta',
  })
  data?: T;

  @ApiPropertyOptional({
    description: 'Mensaje descriptivo',
    example: 'Operación exitosa',
  })
  message?: string;
}

/**
 * SuccessResponseDto - DTO para respuestas exitosas
 */
export class SuccessResponseDto<T = any> {
  @ApiProperty({
    description: 'Indica que la operación fue exitosa',
    example: true,
  })
  success: true;

  @ApiProperty({
    description: 'Datos de la respuesta',
  })
  data: T;

  @ApiPropertyOptional({
    description: 'Mensaje descriptivo',
    example: 'Operación exitosa',
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'Timestamp de la respuesta',
    example: '2025-01-10T12:00:00.000Z',
  })
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'ID único de la petición',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  requestId?: string;
}

/**
 * ErrorResponseDto - DTO para respuestas de error
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'Indica que hubo un error',
    example: false,
  })
  success: false;

  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensaje de error',
    example: 'Error de validación',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo de error',
    example: 'Bad Request',
  })
  error: string;

  @ApiPropertyOptional({
    description: 'Detalles adicionales del error',
    example: ['El email es requerido', 'La contraseña debe tener mínimo 8 caracteres'],
  })
  details?: string[] | Record<string, any>;

  @ApiPropertyOptional({
    description: 'Timestamp del error',
    example: '2025-01-10T12:00:00.000Z',
  })
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Ruta donde ocurrió el error',
    example: '/api/v1/users',
  })
  path?: string;

  @ApiPropertyOptional({
    description: 'ID único de la petición',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  requestId?: string;
}

/**
 * DeleteResponseDto - DTO para respuestas de eliminación
 */
export class DeleteResponseDto {
  @ApiProperty({
    description: 'Indica que la operación fue exitosa',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Datos nulos al eliminar',
    example: null,
  })
  data: null;

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Registro eliminado exitosamente',
  })
  message: string;
}

/**
 * BulkOperationResponseDto - DTO para operaciones en lote
 */
export class BulkOperationResponseDto {
  @ApiProperty({
    description: 'Indica que la operación fue exitosa',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Cantidad de registros afectados',
    example: 5,
  })
  affected: number;

  @ApiPropertyOptional({
    description: 'IDs de registros procesados exitosamente',
    example: ['uuid1', 'uuid2', 'uuid3'],
  })
  processed?: string[];

  @ApiPropertyOptional({
    description: 'IDs de registros que fallaron',
    example: ['uuid4', 'uuid5'],
  })
  failed?: string[];

  @ApiPropertyOptional({
    description: 'Mensaje descriptivo',
    example: '5 registros actualizados exitosamente',
  })
  message?: string;
}

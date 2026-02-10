// src/modules/store/dto/bulk-create-store.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize, ArrayMaxSize, IsArray } from 'class-validator';
import { CreateStoreDto } from './create-store.dto';

/**
 * DTO para creación masiva de tiendas
 *
 * @description
 * Permite crear hasta 100 tiendas en una sola petición.
 * Cada tienda se procesa individualmente: errores en una
 * no detienen la creación de las demás.
 *
 * @example
 * ```json
 * {
 *   "stores": [
 *     { "company_id": "uuid", "nombre": "Tienda 1", "codigo": "T-001", "direccion": "...", "ciudad": "..." },
 *     { "company_id": "uuid", "nombre": "Tienda 2", "codigo": "T-002", "direccion": "...", "ciudad": "..." }
 *   ]
 * }
 * ```
 */
export class BulkCreateStoreDto {
  @ApiProperty({
    description: 'Array de tiendas a crear (mínimo 1, máximo 100)',
    type: [CreateStoreDto],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray({ message: 'stores debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos 1 tienda' })
  @ArrayMaxSize(100, { message: 'No se pueden crear más de 100 tiendas a la vez' })
  @ValidateNested({ each: true })
  @Type(() => CreateStoreDto)
  stores: CreateStoreDto[];
}

/**
 * Resultado individual de creación bulk
 */
export interface IBulkCreateStoreResult {
  /** Índice en el array original (0-based) */
  index: number;
  /** true si se creó exitosamente */
  success: boolean;
  /** Código de la tienda intentada */
  codigo: string;
  /** ID de la tienda creada (solo si success=true) */
  store_id?: string;
  /** Nombre de la tienda creada (solo si success=true) */
  nombre?: string;
  /** Mensaje de error (solo si success=false) */
  error?: string;
}

/**
 * Respuesta de creación masiva de tiendas
 */
export interface IBulkCreateStoreResponse {
  /** Total de tiendas procesadas */
  total: number;
  /** Cantidad creadas exitosamente */
  success_count: number;
  /** Cantidad con error */
  failed_count: number;
  /** Detalle de cada tienda procesada */
  results: IBulkCreateStoreResult[];
}

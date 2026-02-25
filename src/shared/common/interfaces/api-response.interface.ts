// src/shared/common/interfaces/api-response.interface.ts

/**
 * IApiResponse - Interface para respuestas estándar de la API
 *
 * TODAS las respuestas de la API deben seguir este formato.
 *
 * @template T - Tipo de datos en la respuesta
 *
 * @example Success Response
 * ```json
 * {
 *   "success": true,
 *   "data": { "id": "uuid", "name": "Product" },
 *   "message": "Operación exitosa"
 * }
 * ```
 *
 * @example Error Response
 * ```json
 * {
 *   "success": false,
 *   "statusCode": 400,
 *   "message": "Error de validación",
 *   "error": "Bad Request"
 * }
 * ```
 */
export interface IApiResponse<T = any> {
  /**
   * Indica si la operación fue exitosa
   */
  success: boolean;

  /**
   * Datos de la respuesta
   * - En success: contiene los datos solicitados
   * - En error: puede ser null o contener detalles adicionales
   */
  data?: T;

  /**
   * Mensaje descriptivo de la operación
   */
  message?: string;

  /**
   * Código de estado HTTP (solo en errores)
   */
  statusCode?: number;

  /**
   * Tipo de error (solo en errores)
   */
  error?: string;

  /**
   * Detalles adicionales del error (validaciones, etc.)
   */
  details?: Record<string, any> | string[];

  /**
   * Timestamp de la respuesta
   */
  timestamp?: string;

  /**
   * ID de la petición (para trazabilidad)
   */
  requestId?: string;
}

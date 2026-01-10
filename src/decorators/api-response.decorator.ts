import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiResponse,
  getSchemaPath,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

/**
 * Decorator para documentar respuestas estándar en Swagger
 * @param model - Clase del modelo de datos
 * @param statusCode - Código HTTP (200, 201, etc.)
 * @example
 * @ApiStandardResponse(UserResponseDto, 201)
 * @Post()
 * create() {}
 */
export const ApiStandardResponse = <TModel extends Type<any>>(
  model: TModel,
  statusCode: number = 200,
) => {
  const responseDecorator = statusCode === 201 ? ApiCreatedResponse : ApiOkResponse;

  return applyDecorators(
    ApiExtraModels(model),
    responseDecorator({
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              data: { $ref: getSchemaPath(model) },
              message: { type: 'string', example: 'Operación exitosa' },
            },
          },
        ],
      },
    }),
  );
};

/**
 * Decorator para documentar respuestas de error en Swagger
 * @param statusCode - Código HTTP de error
 * @param description - Descripción del error
 */
export const ApiErrorResponse = (statusCode: number, description: string) => {
  return applyDecorators(
    ApiResponse({
      status: statusCode,
      description,
      schema: {
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'number', example: statusCode },
          message: { type: 'string', example: description },
          error: { type: 'string' },
          timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          path: { type: 'string', example: '/api/v1/resource' },
        },
      },
    }),
  );
};

import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Decorator para validar que un campo coincida con otro
 * @param property - Nombre del campo con el que debe coincidir
 * @param validationOptions - Opciones de validación
 * @example
 * export class RegisterDto {
 *   @IsString()
 *   password: string;
 *
 *   @Match('password', { message: 'Las contraseñas no coinciden' })
 *   passwordConfirm: string;
 * }
 */
export function Match(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'match',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} debe coincidir con ${relatedPropertyName}`;
        },
      },
    });
  };
}

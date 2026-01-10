import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new BadRequestException(`"${value}" no es un número entero válido`);
    }

    return val;
  }
}

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new BadRequestException(`"${value}" no es un número entero válido`);
    }

    if (val < 0) {
      throw new BadRequestException(`"${value}" debe ser un número positivo`);
    }

    return val;
  }
}

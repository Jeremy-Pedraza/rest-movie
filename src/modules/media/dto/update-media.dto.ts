// src/modules/media/dto/update-media.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateMediaDto } from './create-media.dto';

export class UpdateMediaDto extends PartialType(CreateMediaDto) {}

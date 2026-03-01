// src/modules/genre/dto/update-genre.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateGenreDto } from './create-genre.dto';

export class UpdateGenreDto extends PartialType(CreateGenreDto) {}

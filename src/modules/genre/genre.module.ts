// src/modules/genre/genre.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GenreEntity } from './entities/genre.entity';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { GenreRepository } from './genre.repository';

@Module({
  imports: [TypeOrmModule.forFeature([GenreEntity])],
  controllers: [GenreController],
  providers: [GenreService, GenreRepository],
  exports: [GenreService, GenreRepository],
})
export class GenreModule {}

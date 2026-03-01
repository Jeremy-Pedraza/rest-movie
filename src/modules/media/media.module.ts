// src/modules/media/media.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GenreModule } from '@modules/genre';
import { DirectorModule } from '@modules/director';
import { ProducerModule } from '@modules/producer';
import { TypeModule } from '@modules/type';
import { MediaEntity } from './entities/media.entity';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaRepository } from './media.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaEntity]),
    GenreModule,
    DirectorModule,
    ProducerModule,
    TypeModule,
  ],
  controllers: [MediaController],
  providers: [MediaService, MediaRepository],
  exports: [MediaService, MediaRepository],
})
export class MediaModule {}

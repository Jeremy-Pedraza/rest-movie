// src/modules/director/director.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DirectorEntity } from './entities/director.entity';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { DirectorRepository } from './director.repository';

@Module({
  imports: [TypeOrmModule.forFeature([DirectorEntity])],
  controllers: [DirectorController],
  providers: [DirectorService, DirectorRepository],
  exports: [DirectorService, DirectorRepository],
})
export class DirectorModule {}

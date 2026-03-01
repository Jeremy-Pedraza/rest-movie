// src/modules/type/type.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypeEntity } from './entities/type.entity';
import { TypeController } from './type.controller';
import { TypeService } from './type.service';
import { TypeRepository } from './type.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TypeEntity])],
  controllers: [TypeController],
  providers: [TypeService, TypeRepository],
  exports: [TypeService, TypeRepository],
})
export class TypeModule {}

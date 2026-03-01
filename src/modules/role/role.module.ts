// src/modules/role/role.module.ts

import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoleEntity } from './entities/role.entity';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { RoleRepository } from './role.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity])],
  controllers: [RoleController],
  providers: [RoleService, RoleRepository],
  exports: [RoleService, RoleRepository],
})
export class RoleModule implements OnModuleInit {
  private readonly logger = new Logger(RoleModule.name);

  constructor(private readonly roleService: RoleService) {}

  async onModuleInit(): Promise<void> {
    await this.roleService.seedRoles();
    this.logger.log('Roles seeded successfully');
  }
}

/**
 * @fileoverview Seed de permisos
 * @module database/seeds
 */

import { DataSource } from 'typeorm';
import { PermissionEntity } from '@modules/user/entities/permission.entity';
import { PERMISSION_DEFINITIONS } from './seed.constants';

export async function seedPermissions(dataSource: DataSource): Promise<void> {
  console.log('\n📋 Seeding permissions...');

  const permissionRepo = dataSource.getRepository(PermissionEntity);

  let created = 0;
  let skipped = 0;

  for (const permDef of PERMISSION_DEFINITIONS) {
    // Verificar si ya existe
    const exists = await permissionRepo.findOne({
      where: { name: permDef.name },
    });

    if (exists) {
      skipped++;
      continue;
    }

    // Crear permiso
    const permission = permissionRepo.create({
      name: permDef.name,
      module: permDef.module,
      action: permDef.action,
      description: permDef.description,
      isSystem: true,
      isActive: true,
    });

    await permissionRepo.save(permission);
    created++;
    console.log(`  ✓ Created permission: ${permDef.name}`);
  }

  console.log(`📋 Permissions: ${created} created, ${skipped} skipped (already exist)`);
}

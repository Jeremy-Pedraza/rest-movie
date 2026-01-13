/**
 * @fileoverview Seed de roles
 * @module database/seeds
 */

import { DataSource, In } from 'typeorm';
import { RoleEntity } from '@modules/user/entities/role.entity';
import { PermissionEntity } from '@modules/user/entities/permission.entity';
import { ROLE_DEFINITIONS } from './seed.constants';

export async function seedRoles(dataSource: DataSource): Promise<void> {
  console.log('\n👥 Seeding roles...');

  const roleRepo = dataSource.getRepository(RoleEntity);
  const permissionRepo = dataSource.getRepository(PermissionEntity);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const roleDef of ROLE_DEFINITIONS) {
    // Buscar permisos
    const permissions = await permissionRepo.find({
      where: { name: In(roleDef.permissions) },
    });

    if (permissions.length !== roleDef.permissions.length) {
      const foundNames = permissions.map(p => p.name);
      const missing = roleDef.permissions.filter(p => !foundNames.includes(p));
      console.warn(`  ⚠ Role ${roleDef.name}: Missing permissions: ${missing.join(', ')}`);
    }

    // Verificar si ya existe
    let role = await roleRepo.findOne({
      where: { name: roleDef.name },
      relations: ['permissions'],
    });

    if (role) {
      // Actualizar permisos si cambiaron
      const currentPermNames = role.permissions.map(p => p.name).sort();
      const newPermNames = permissions.map(p => p.name).sort();

      if (JSON.stringify(currentPermNames) !== JSON.stringify(newPermNames)) {
        role.permissions = permissions;
        role.description = roleDef.description;
        role.hierarchy = roleDef.hierarchy;
        await roleRepo.save(role);
        updated++;
        console.log(`  ↻ Updated role: ${roleDef.name} (${permissions.length} permissions)`);
      } else {
        skipped++;
      }
      continue;
    }

    // Crear rol
    role = roleRepo.create({
      name: roleDef.name,
      description: roleDef.description,
      hierarchy: roleDef.hierarchy,
      isSystem: roleDef.isSystem,
      isActive: true,
      permissions,
    });

    await roleRepo.save(role);
    created++;
    console.log(`  ✓ Created role: ${roleDef.name} (${permissions.length} permissions)`);
  }

  console.log(`👥 Roles: ${created} created, ${updated} updated, ${skipped} skipped`);
}

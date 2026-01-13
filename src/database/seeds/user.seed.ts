/**
 * @fileoverview Seed de usuarios iniciales
 * @module database/seeds
 */

import { DataSource, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity, UserStatus } from '@modules/user/entities/user.entity';
import { RoleEntity } from '@modules/user/entities/role.entity';
import { USER_DEFINITIONS } from './seed.constants';

const BCRYPT_ROUNDS = 12;

export async function seedUsers(dataSource: DataSource): Promise<void> {
  console.log('\n👤 Seeding users...');

  const userRepo = dataSource.getRepository(UserEntity);
  const roleRepo = dataSource.getRepository(RoleEntity);

  let created = 0;
  let skipped = 0;

  for (const userDef of USER_DEFINITIONS) {
    // Verificar si ya existe
    const exists = await userRepo.findOne({
      where: { email: userDef.email },
    });

    if (exists) {
      skipped++;
      console.log(`  - Skipped user: ${userDef.email} (already exists)`);
      continue;
    }

    // Buscar roles
    const roles = await roleRepo.find({
      where: { name: In(userDef.roles) },
    });

    if (roles.length !== userDef.roles.length) {
      const foundNames = roles.map(r => r.name);
      const missing = userDef.roles.filter(r => !foundNames.includes(r));
      console.warn(`  ⚠ User ${userDef.email}: Missing roles: ${missing.join(', ')}`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userDef.password, BCRYPT_ROUNDS);

    // Crear usuario
    const user = userRepo.create({
      email: userDef.email,
      password: hashedPassword,
      firstName: userDef.firstName,
      lastName: userDef.lastName,
      roles,
      emailVerified: userDef.emailVerified,
      status: userDef.status === 'active' ? UserStatus.ACTIVE : UserStatus.PENDING,
    });

    await userRepo.save(user);
    created++;
    console.log(`  ✓ Created user: ${userDef.email} (roles: ${userDef.roles.join(', ')})`);
  }

  console.log(`👤 Users: ${created} created, ${skipped} skipped (already exist)`);

  // Mostrar credenciales en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n📝 Test credentials (development only):');
    console.log('  ┌──────────────────────────────────────────────────┐');
    for (const userDef of USER_DEFINITIONS) {
      console.log(`  │ ${userDef.email.padEnd(25)} │ ${userDef.password.padEnd(15)} │`);
    }
    console.log('  └──────────────────────────────────────────────────┘');
  }
}

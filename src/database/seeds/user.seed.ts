/**
 * @fileoverview Seed de usuarios iniciales
 * @module database/seeds
 */

import { DataSource, In } from 'typeorm';
import { UserEntity, UserStatus } from '@modules/user/entities/user.entity';
import { RoleEntity } from '@modules/user/entities/role.entity';
import { CompanyEntity } from '@modules/company/entities';
import { USER_DEFINITIONS } from './seed.constants';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  console.log('\n[USERS] Seeding users...');

  const userRepo = dataSource.getRepository(UserEntity);
  const roleRepo = dataSource.getRepository(RoleEntity);
  const companyRepo = dataSource.getRepository(CompanyEntity);

  // Buscar la company Taco Bell RD para vincular todos los usuarios
  const tacoBellRD = await companyRepo.findOne({
    where: { subdomain: 'republica' },
  });

  if (!tacoBellRD) {
    console.warn('  [WARN] Company "Taco Bell Republica Dominicana" no encontrada.');
  } else {
    console.log(`  [LINK] Usuarios vinculados a: ${tacoBellRD.name} (${tacoBellRD.id})`);
  }

  let created = 0;
  let updated = 0;

  for (const userDef of USER_DEFINITIONS) {
    const roles = await roleRepo.find({
      where: { name: In(userDef.roles) },
    });

    if (roles.length !== userDef.roles.length) {
      const foundNames = roles.map((role) => role.name);
      const missing = userDef.roles.filter((role) => !foundNames.includes(role));
      console.warn(`  [WARN] User ${userDef.email}: Missing roles: ${missing.join(', ')}`);
    }

    const existingUser = await userRepo.findOne({
      where: { email: userDef.email },
      relations: ['roles'],
    });

    if (existingUser) {
      existingUser.first_name = userDef.firstName;
      existingUser.last_name = userDef.lastName;
      existingUser.roles = roles;
      existingUser.email_verified = userDef.emailVerified;
      existingUser.status = userDef.status === 'active' ? UserStatus.ACTIVE : UserStatus.PENDING;

      if (tacoBellRD) {
        existingUser.company_id = tacoBellRD.id;
      }

      await userRepo.save(existingUser);
      updated++;
      console.log(`  [UPDATE] User ${userDef.email}`);
      continue;
    }

    const user = userRepo.create({
      email: userDef.email,
      password: userDef.password,
      first_name: userDef.firstName,
      last_name: userDef.lastName,
      roles,
      email_verified: userDef.emailVerified,
      status: userDef.status === 'active' ? UserStatus.ACTIVE : UserStatus.PENDING,
      ...(tacoBellRD ? { company_id: tacoBellRD.id } : {}),
    });

    await userRepo.save(user);
    created++;
    console.log(`  [CREATE] User ${userDef.email}`);
  }

  console.log(`\n  Resumen users: ${created} creados, ${updated} actualizados`);

  if (process.env.NODE_ENV !== 'production') {
    console.log('\n  Credenciales de prueba (solo desarrollo):');
    for (const userDef of USER_DEFINITIONS) {
      console.log(`    ${userDef.email} -> ${userDef.password}`);
    }
  }
}

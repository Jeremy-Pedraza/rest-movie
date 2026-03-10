import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AUTH_BOOTSTRAP_DEFAULTS, AUTH_BOOTSTRAP_MESSAGES, ROLES } from '@constants';

export async function seedAdminUser(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository('UserEntity');
  const roleRepo = dataSource.getRepository('RoleEntity');

  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const adminFirstName =
    process.env.BOOTSTRAP_ADMIN_FIRST_NAME || AUTH_BOOTSTRAP_DEFAULTS.FIRST_NAME;
  const adminLastName =
    process.env.BOOTSTRAP_ADMIN_LAST_NAME || AUTH_BOOTSTRAP_DEFAULTS.LAST_NAME;

  if (!adminEmail || !adminPassword) {
    console.log(AUTH_BOOTSTRAP_MESSAGES.OMITTED);
    return;
  }

  const exists = await userRepo.findOne({ where: { email: adminEmail } });

  if (exists) {
    console.log(AUTH_BOOTSTRAP_MESSAGES.ALREADY_EXISTS);
    return;
  }

  const adminRole = await roleRepo.findOne({ where: { name: ROLES.ADMINISTRADOR } });
  if (!adminRole) {
    console.error(AUTH_BOOTSTRAP_MESSAGES.ROLE_MISSING);
    return;
  }

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  const hashedPassword = await bcrypt.hash(adminPassword, rounds);

  const user = userRepo.create({
    firstName: adminFirstName,
    lastName: adminLastName,
    email: adminEmail,
    password: hashedPassword,
    isActive: true,
    roles: [adminRole],
  });

  await userRepo.save(user);
  console.log(`  -> Admin user seeded: ${adminEmail}`);
}

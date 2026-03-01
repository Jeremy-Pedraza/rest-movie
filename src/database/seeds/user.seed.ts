import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export async function seedAdminUser(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository('UserEntity');
  const roleRepo = dataSource.getRepository('RoleEntity');

  const adminEmail = 'admin@admin.com';
  const exists = await userRepo.findOne({ where: { email: adminEmail } });

  if (exists) {
    console.log('  -> Admin user already exists, skipping');
    return;
  }

  const adminRole = await roleRepo.findOne({ where: { name: 'administrador' } });
  if (!adminRole) {
    console.error('  -> ERROR: Role "administrador" not found. Run role seed first.');
    return;
  }

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  const hashedPassword = await bcrypt.hash('Admin@123', rounds);

  const user = userRepo.create({
    firstName: 'Admin',
    lastName: 'System',
    email: adminEmail,
    password: hashedPassword,
    isActive: true,
    roles: [adminRole],
  });

  await userRepo.save(user);
  console.log('  -> Admin user seeded: admin@admin.com / Admin@123');
}

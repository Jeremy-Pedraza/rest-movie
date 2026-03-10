import dataSource from '@config/database/data-source';
import { AUTH_BOOTSTRAP_MESSAGES } from '@constants';
import { seedRoles } from '@database/seeds/role.seed';
import { seedAdminUser } from '@database/seeds/user.seed';

async function bootstrapAdmin(): Promise<void> {
  if (process.env.ALLOW_ADMIN_BOOTSTRAP !== 'true') {
    throw new Error(AUTH_BOOTSTRAP_MESSAGES.NOT_ALLOWED);
  }

  await dataSource.initialize();

  try {
    await seedRoles(dataSource);
    await seedAdminUser(dataSource);
  } finally {
    await dataSource.destroy();
  }
}

bootstrapAdmin().catch((error) => {
  console.error('Admin bootstrap failed:', error);
  process.exit(1);
});

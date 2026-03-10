import { DataSource } from 'typeorm';
import { SEED_DATA } from '@constants';

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository('RoleEntity');

  for (const role of SEED_DATA.roles) {
    const exists = await repository.findOne({ where: { name: role.name } });
    if (!exists) {
      await repository.save(repository.create({ ...role }));
    }
  }

  console.log(`  -> Roles seeded: ${SEED_DATA.roles.length} records`);
}

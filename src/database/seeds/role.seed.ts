import { DataSource } from 'typeorm';

const DEFAULT_ROLES = [
  { name: 'administrador', description: 'Acceso completo al sistema', isActive: true },
  { name: 'estudiante', description: 'Acceso de estudiante', isActive: true },
  { name: 'docente', description: 'Acceso de docente', isActive: true },
  { name: 'colaborador', description: 'Acceso de colaborador', isActive: true },
  { name: 'publico', description: 'Acceso publico limitado', isActive: true },
];

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository('RoleEntity');

  for (const role of DEFAULT_ROLES) {
    const exists = await repository.findOne({ where: { name: role.name } });
    if (!exists) {
      await repository.save(repository.create(role));
    }
  }

  console.log(`  -> Roles seeded: ${DEFAULT_ROLES.length} records`);
}

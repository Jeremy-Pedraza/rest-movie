import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateUserRolesTable1740000800000 implements MigrationInterface {
  name = 'CreateUserRolesTable1740000800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        schema: 'public',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'role_id',
            type: 'uuid',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Primary key compuesta
    await queryRunner.query(
      'ALTER TABLE "user_roles" ADD CONSTRAINT "PK_user_roles" PRIMARY KEY ("user_id", "role_id")',
    );

    // Indices
    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({ name: 'IDX_user_roles_user_id', columnNames: ['user_id'] }),
    );
    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({ name: 'IDX_user_roles_role_id', columnNames: ['role_id'] }),
    );

    // Foreign Keys
    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        name: 'FK_user_roles_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        name: 'FK_user_roles_role',
        columnNames: ['role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_roles');
  }
}

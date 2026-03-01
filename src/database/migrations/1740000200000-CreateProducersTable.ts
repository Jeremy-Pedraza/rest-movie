import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateProducersTable1740000200000 implements MigrationInterface {
  name = 'CreateProducersTable1740000200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'producers',
        schema: 'public',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '150',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'slogan',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'producers',
      new TableIndex({ name: 'IDX_producers_name', columnNames: ['name'] }),
    );
    await queryRunner.createIndex(
      'producers',
      new TableIndex({ name: 'IDX_producers_is_active', columnNames: ['is_active'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('producers');
  }
}

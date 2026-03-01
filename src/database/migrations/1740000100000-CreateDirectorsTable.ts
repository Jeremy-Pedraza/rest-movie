import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDirectorsTable1740000100000 implements MigrationInterface {
  name = 'CreateDirectorsTable1740000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'directors',
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
            name: 'names',
            type: 'varchar',
            length: '150',
            isNullable: false,
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
      'directors',
      new TableIndex({ name: 'IDX_directors_names', columnNames: ['names'] }),
    );
    await queryRunner.createIndex(
      'directors',
      new TableIndex({ name: 'IDX_directors_is_active', columnNames: ['is_active'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('directors');
  }
}

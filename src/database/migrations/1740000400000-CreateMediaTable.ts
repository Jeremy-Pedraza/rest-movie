import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateMediaTable1740000400000 implements MigrationInterface {
  name = 'CreateMediaTable1740000400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'media',
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
            name: 'serial',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'synopsis',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'url',
            type: 'varchar',
            length: '500',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'cover_image',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'release_year',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'genre_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'director_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'producer_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type_id',
            type: 'uuid',
            isNullable: false,
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

    // Indices
    await queryRunner.createIndex(
      'media',
      new TableIndex({ name: 'IDX_media_serial', columnNames: ['serial'] }),
    );
    await queryRunner.createIndex(
      'media',
      new TableIndex({ name: 'IDX_media_title', columnNames: ['title'] }),
    );

    // Foreign Keys
    await queryRunner.createForeignKey(
      'media',
      new TableForeignKey({
        name: 'FK_media_genre',
        columnNames: ['genre_id'],
        referencedTableName: 'genres',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'media',
      new TableForeignKey({
        name: 'FK_media_director',
        columnNames: ['director_id'],
        referencedTableName: 'directors',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'media',
      new TableForeignKey({
        name: 'FK_media_producer',
        columnNames: ['producer_id'],
        referencedTableName: 'producers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'media',
      new TableForeignKey({
        name: 'FK_media_type',
        columnNames: ['type_id'],
        referencedTableName: 'types',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('media');
  }
}

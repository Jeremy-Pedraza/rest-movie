import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateLogsTable1740000500000 implements MigrationInterface {
  name = 'CreateLogsTable1740000500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'logs',
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
            name: 'level',
            type: 'enum',
            enum: ['error', 'warn', 'info', 'debug', 'verbose'],
            default: "'info'",
          },
          {
            name: 'context',
            type: 'enum',
            enum: ['http', 'database', 'auth', 'business', 'system', 'queue', 'cache', 'external'],
            default: "'system'",
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'stack',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'request_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'ip',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'method',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'url',
            type: 'varchar',
            length: '2048',
            isNullable: true,
          },
          {
            name: 'status_code',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'response_time',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'service',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'error_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'logs',
      new TableIndex({ name: 'IDX_logs_level_created', columnNames: ['level', 'created_at'] }),
    );
    await queryRunner.createIndex(
      'logs',
      new TableIndex({ name: 'IDX_logs_context_created', columnNames: ['context', 'created_at'] }),
    );
    await queryRunner.createIndex(
      'logs',
      new TableIndex({ name: 'IDX_logs_user_created', columnNames: ['user_id', 'created_at'] }),
    );
    await queryRunner.createIndex(
      'logs',
      new TableIndex({ name: 'IDX_logs_request_id', columnNames: ['request_id'] }),
    );
    await queryRunner.createIndex(
      'logs',
      new TableIndex({ name: 'IDX_logs_level', columnNames: ['level'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('logs');
  }
}

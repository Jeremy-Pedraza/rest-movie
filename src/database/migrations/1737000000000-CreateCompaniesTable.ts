// src/database/migrations/1737000000000-CreateCompaniesTable.ts

/**
 * @fileoverview Migración para crear tabla companies (multi-tenant)
 * @module database/migrations
 *
 * Esta migración crea la tabla companies en el schema public
 * para soportar arquitectura multi-tenant donde cada company
 * tiene su propio schema de PostgreSQL.
 */

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCompaniesTable1737000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla companies en schema public
    await queryRunner.createTable(
      new Table({
        name: 'companies',
        schema: 'public',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Nombre de la empresa',
          },
          {
            name: 'schema',
            type: 'varchar',
            length: '100',
            isNullable: false,
            isUnique: true,
            comment: 'Schema de PostgreSQL para esta company',
          },
          {
            name: 'domain',
            type: 'varchar',
            length: '255',
            isNullable: true,
            isUnique: true,
            comment: 'Dominio completo de la empresa',
          },
          {
            name: 'subdomain',
            type: 'varchar',
            length: '50',
            isNullable: true,
            isUnique: true,
            comment: 'Subdominio de la empresa',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
            comment: 'Estado activo/inactivo de la empresa',
          },
          {
            name: 'settings',
            type: 'jsonb',
            isNullable: true,
            comment: 'Configuración adicional de la empresa',
          },
          {
            name: 'plan',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Plan/Tier de la empresa',
          },
          {
            name: 'plan_expires_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Fecha de expiración del plan',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Crear índices para búsquedas eficientes
    await queryRunner.createIndex(
      'companies',
      new TableIndex({
        name: 'idx_company_schema',
        columnNames: ['schema'],
      }),
    );

    await queryRunner.createIndex(
      'companies',
      new TableIndex({
        name: 'idx_company_domain',
        columnNames: ['domain'],
      }),
    );

    await queryRunner.createIndex(
      'companies',
      new TableIndex({
        name: 'idx_company_subdomain',
        columnNames: ['subdomain'],
      }),
    );

    await queryRunner.createIndex(
      'companies',
      new TableIndex({
        name: 'idx_company_is_active',
        columnNames: ['is_active'],
      }),
    );

    // Insertar company por defecto para desarrollo (schema public)
    await queryRunner.query(`
      INSERT INTO public.companies (name, schema, subdomain, "is_active", settings)
      VALUES (
        'Sistema - Public Schema',
        'public',
        'public',
        true,
        '{"description": "Schema público para usuarios sin empresa asignada"}'::jsonb
      );
    `);

    console.log('✅ Tabla companies creada exitosamente');
    console.log('✅ Company por defecto (public) insertada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.dropIndex('companies', 'idx_company_is_active');
    await queryRunner.dropIndex('companies', 'idx_company_subdomain');
    await queryRunner.dropIndex('companies', 'idx_company_domain');
    await queryRunner.dropIndex('companies', 'idx_company_schema');

    // Eliminar tabla
    await queryRunner.dropTable('companies', true);

    console.log('✅ Tabla companies eliminada');
  }
}

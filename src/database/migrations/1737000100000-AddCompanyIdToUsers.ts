// src/database/migrations/1737000100000-AddCompanyIdToUsers.ts

/**
 * @fileoverview Migración para agregar companyId a tabla users
 * @module database/migrations
 *
 * Esta migración agrega la columna companyId a users y crea
 * la foreign key hacia companies para soportar multi-tenant.
 */

import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCompanyIdToUsers1737000100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna companyId a users
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'company_id',
        type: 'uuid',
        isNullable: true,
        comment: 'ID de la empresa a la que pertenece el usuario',
      }),
    );

    // Crear foreign key hacia companies
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        name: 'fk_users_company',
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL', // Si se elimina la company, el usuario queda sin company
        onUpdate: 'CASCADE',
      }),
    );

    // Crear índice para búsquedas por company_id
    await queryRunner.query(`
      CREATE INDEX idx_users_company_id ON public.users ("company_id");
    `);

    console.log('✅ Columna company_id agregada a users');
    console.log('✅ Foreign key fk_users_company creada');
    console.log('✅ Índice idx_users_company_id creado');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índice
    await queryRunner.query(`
      DROP INDEX IF EXISTS public.idx_users_company_id;
    `);

    // Eliminar foreign key
    await queryRunner.dropForeignKey('users', 'fk_users_company');

    // Eliminar columna
    await queryRunner.dropColumn('users', 'company_id');

    console.log('✅ Columna company_id eliminada de users');
  }
}

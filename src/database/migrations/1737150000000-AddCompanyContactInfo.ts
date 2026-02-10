// src/database/migrations/1737150000000-AddCompanyContactInfo.ts

/**
 * @fileoverview Migración para agregar campos de contacto e información fiscal a companies
 * @module database/migrations
 *
 * Agrega los campos:
 * - ruc: Identificación fiscal (RUC/NIT/RNC)
 * - email: Email corporativo
 * - telefono: Teléfono de contacto
 * - direccion: Dirección fiscal
 * - pais: País de operación
 * - ciudad: Ciudad principal
 */

import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddCompanyContactInfo1737150000000 implements MigrationInterface {
  name = 'AddCompanyContactInfo1737150000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 Iniciando migración: AddCompanyContactInfo');

    // Verificar si la tabla existe
    const tableExists = await queryRunner.hasTable('companies');
    if (!tableExists) {
      console.log('❌ La tabla companies no existe. Ejecuta primero CreateCompaniesTable.');
      throw new Error('La tabla companies no existe');
    }

    // Verificar si los campos ya existen (idempotencia)
    const table = await queryRunner.getTable('companies');
    const hasRuc = table?.columns.find((col) => col.name === 'ruc');

    if (hasRuc) {
      console.log('⚠️ Los campos de contacto ya existen. Saltando migración.');
      return;
    }

    // ============================================
    // AGREGAR COLUMNAS DE CONTACTO
    // ============================================

    console.log('📝 Agregando columna: ruc');
    await queryRunner.addColumn(
      'companies',
      new TableColumn({
        name: 'ruc',
        type: 'varchar',
        length: '100',
        isNullable: true, // Temporalmente nullable para registros existentes
        comment: 'RUC/NIT/RNC de la empresa - Identificación fiscal',
      }),
    );

    console.log('📝 Agregando columna: email');
    await queryRunner.addColumn(
      'companies',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        length: '255',
        isNullable: true, // Temporalmente nullable para registros existentes
        comment: 'Email corporativo de la empresa',
      }),
    );

    console.log('📝 Agregando columna: telefono');
    await queryRunner.addColumn(
      'companies',
      new TableColumn({
        name: 'telefono',
        type: 'varchar',
        length: '20',
        isNullable: true,
        comment: 'Teléfono corporativo',
      }),
    );

    console.log('📝 Agregando columna: direccion');
    await queryRunner.addColumn(
      'companies',
      new TableColumn({
        name: 'direccion',
        type: 'text',
        isNullable: true,
        comment: 'Dirección fiscal de la empresa',
      }),
    );

    console.log('📝 Agregando columna: pais');
    await queryRunner.addColumn(
      'companies',
      new TableColumn({
        name: 'pais',
        type: 'varchar',
        length: '100',
        isNullable: true, // Temporalmente nullable para registros existentes
        comment: 'País donde opera la empresa',
      }),
    );

    console.log('📝 Agregando columna: ciudad');
    await queryRunner.addColumn(
      'companies',
      new TableColumn({
        name: 'ciudad',
        type: 'varchar',
        length: '100',
        isNullable: true, // Temporalmente nullable para registros existentes
        comment: 'Ciudad principal de operación',
      }),
    );

    // ============================================
    // ACTUALIZAR REGISTROS EXISTENTES
    // ============================================

    console.log('📝 Actualizando registros existentes con valores por defecto...');

    await queryRunner.query(`
      UPDATE companies 
      SET 
        ruc = COALESCE(ruc, '000000000'),
        email = COALESCE(email, 'admin@' || subdomain || '.com'),
        pais = COALESCE(pais, 'Sistema'),
        ciudad = COALESCE(ciudad, 'Sistema')
      WHERE ruc IS NULL OR email IS NULL OR pais IS NULL OR ciudad IS NULL
    `);

    // ============================================
    // CREAR ÍNDICES
    // ============================================

    console.log('📝 Creando índices...');

    await queryRunner.createIndex(
      'companies',
      new TableIndex({
        name: 'idx_company_ruc',
        columnNames: ['ruc'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'companies',
      new TableIndex({
        name: 'idx_company_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'companies',
      new TableIndex({
        name: 'idx_company_pais',
        columnNames: ['pais'],
      }),
    );

    await queryRunner.createIndex(
      'companies',
      new TableIndex({
        name: 'idx_company_ciudad',
        columnNames: ['ciudad'],
      }),
    );

    // ============================================
    // HACER COLUMNAS NOT NULL (después de actualizar)
    // ============================================

    console.log('📝 Aplicando restricciones NOT NULL...');

    await queryRunner.changeColumn(
      'companies',
      'ruc',
      new TableColumn({
        name: 'ruc',
        type: 'varchar',
        length: '100',
        isNullable: false,
        comment: 'RUC/NIT/RNC de la empresa - Identificación fiscal',
      }),
    );

    await queryRunner.changeColumn(
      'companies',
      'email',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        length: '255',
        isNullable: false,
        comment: 'Email corporativo de la empresa',
      }),
    );

    await queryRunner.changeColumn(
      'companies',
      'pais',
      new TableColumn({
        name: 'pais',
        type: 'varchar',
        length: '100',
        isNullable: false,
        comment: 'País donde opera la empresa',
      }),
    );

    await queryRunner.changeColumn(
      'companies',
      'ciudad',
      new TableColumn({
        name: 'ciudad',
        type: 'varchar',
        length: '100',
        isNullable: false,
        comment: 'Ciudad principal de operación',
      }),
    );

    // ============================================
    // RESUMEN
    // ============================================

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  MIGRACIÓN COMPLETADA: AddCompanyContactInfo               ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  ✅ ruc (varchar 100) + índice único                       ║');
    console.log('║  ✅ email (varchar 255) + índice                           ║');
    console.log('║  ✅ telefono (varchar 20)                                  ║');
    console.log('║  ✅ direccion (text)                                       ║');
    console.log('║  ✅ pais (varchar 100) + índice                            ║');
    console.log('║  ✅ ciudad (varchar 100) + índice                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Revirtiendo migración: AddCompanyContactInfo');

    // Eliminar índices
    const indicesToDrop = [
      'idx_company_ruc',
      'idx_company_email',
      'idx_company_pais',
      'idx_company_ciudad',
    ];

    for (const indexName of indicesToDrop) {
      try {
        await queryRunner.dropIndex('companies', indexName);
        console.log(`📝 Índice ${indexName} eliminado`);
      } catch {
        console.log(`⚠️ Índice ${indexName} no existe, saltando...`);
      }
    }

    // Eliminar columnas
    const columnsToRemove = ['ciudad', 'pais', 'direccion', 'telefono', 'email', 'ruc'];

    for (const columnName of columnsToRemove) {
      try {
        await queryRunner.dropColumn('companies', columnName);
        console.log(`📝 Columna ${columnName} eliminada`);
      } catch {
        console.log(`⚠️ Columna ${columnName} no existe, saltando...`);
      }
    }

    console.log('✅ Migración revertida exitosamente');
  }
}

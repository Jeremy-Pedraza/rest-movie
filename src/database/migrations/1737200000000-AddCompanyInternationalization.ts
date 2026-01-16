// src/database/migrations/1737200000000-AddCompanyInternationalization.ts

/**
 * @fileoverview Migración para agregar campos de internacionalización a companies
 * @module database/migrations
 *
 * FASE 1 del Plan Multi-Tenant para Reportes
 * Agrega soporte para:
 * - Zona horaria
 * - Código de país (ISO 3166-1)
 * - Departamento/Estado
 * - Moneda (código y símbolo)
 * - Formato de fecha
 * - Configuración fiscal
 */

import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddCompanyInternationalization1737200000000 implements MigrationInterface {
  name = 'AddCompanyInternationalization1737200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 Iniciando migración: AddCompanyInternationalization');

    // Verificar si la tabla existe
    const tableExists = await queryRunner.hasTable('companies');
    if (!tableExists) {
      console.log('❌ La tabla companies no existe. Ejecuta primero CreateCompaniesTable.');
      throw new Error('La tabla companies no existe');
    }

    // Verificar si los campos ya existen (idempotencia)
    const table = await queryRunner.getTable('companies');
    const hasTimezone = table?.columns.find((col) => col.name === 'timezone');

    if (hasTimezone) {
      console.log('⚠️ Los campos de internacionalización ya existen. Saltando migración.');
      return;
    }

    // ============================================
    // AGREGAR NUEVAS COLUMNAS
    // ============================================

    console.log('📝 Agregando columna: timezone');
    await queryRunner.addColumn(
      'companies',
      new TableColumn({
        name: 'timezone',
        type: 'varchar',
        length: '50',
        isNullable: false,
        default: "'America/Santo_Domingo'",
        comment: 'Zona horaria IANA (ej: America/Santo_Domingo)',
      }),
    );

    console.log('📝 Agregando columna: country_code');
    await queryRunner.addColumn(
      'companies',
      new TableColumn({
        name: 'country_code',
        type: 'varchar',
        length: '2',
        isNullable: false,
        default: "'DO'",
        comment: 'Código ISO 3166-1 alpha-2 del país',
      }),
    );

    console.log('📝 Agregando columna: departamento');
    await queryRunner.addColumn(
      'companies',
      new TableColumn({
        name: 'departamento',
        type: 'varchar',
        length: '100',
        isNullable: true,
        comment: 'Departamento/Estado/Provincia principal',
      }),
    );

    console.log('📝 Agregando columna: currency_code');
    await queryRunner.addColumn(
      'companies',
      new TableColumn({
        name: 'currency_code',
        type: 'varchar',
        length: '3',
        isNullable: false,
        default: "'DOP'",
        comment: 'Código ISO 4217 de moneda (ej: DOP, GTQ, USD)',
      }),
    );

    console.log('📝 Agregando columna: currency_symbol');
    await queryRunner.addColumn(
      'companies',
      new TableColumn({
        name: 'currency_symbol',
        type: 'varchar',
        length: '10',
        isNullable: false,
        default: "'RD$'",
        comment: 'Símbolo de moneda para mostrar',
      }),
    );

    console.log('📝 Agregando columna: date_format');
    await queryRunner.addColumn(
      'companies',
      new TableColumn({
        name: 'date_format',
        type: 'varchar',
        length: '20',
        isNullable: false,
        default: "'DD/MM/YYYY'",
        comment: 'Formato de fecha preferido',
      }),
    );

    console.log('📝 Agregando columna: tax_config');
    await queryRunner.addColumn(
      'companies',
      new TableColumn({
        name: 'tax_config',
        type: 'jsonb',
        isNullable: true,
        comment: 'Configuración fiscal: { tax_rate, tax_name, tax_included, rules }',
      }),
    );

    // ============================================
    // CREAR ÍNDICE PARA country_code
    // ============================================

    console.log('📝 Creando índice: idx_company_country_code');
    await queryRunner.createIndex(
      'companies',
      new TableIndex({
        name: 'idx_company_country_code',
        columnNames: ['country_code'],
      }),
    );

    // ============================================
    // ACTUALIZAR REGISTROS EXISTENTES (si hay)
    // ============================================

    console.log('📝 Actualizando registros existentes con valores por defecto...');

    // Actualizar tax_config para registros existentes de RD
    await queryRunner.query(`
      UPDATE companies 
      SET tax_config = '{"tax_rate": 0.18, "tax_name": "ITBIS", "tax_included": true}'::jsonb
      WHERE tax_config IS NULL AND country_code = 'DO'
    `);

    // ============================================
    // RESUMEN
    // ============================================

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  MIGRACIÓN COMPLETADA: AddCompanyInternationalization      ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  ✅ timezone (varchar 50)                                  ║');
    console.log('║  ✅ country_code (varchar 2) + índice                      ║');
    console.log('║  ✅ departamento (varchar 100)                             ║');
    console.log('║  ✅ currency_code (varchar 3)                              ║');
    console.log('║  ✅ currency_symbol (varchar 10)                           ║');
    console.log('║  ✅ date_format (varchar 20)                               ║');
    console.log('║  ✅ tax_config (jsonb)                                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Revirtiendo migración: AddCompanyInternationalization');

    // Eliminar índice
    const table = await queryRunner.getTable('companies');
    const index = table?.indices.find((idx) => idx.name === 'idx_company_country_code');
    if (index) {
      await queryRunner.dropIndex('companies', 'idx_company_country_code');
    }

    // Eliminar columnas en orden inverso
    const columnsToRemove = [
      'tax_config',
      'date_format',
      'currency_symbol',
      'currency_code',
      'departamento',
      'country_code',
      'timezone',
    ];

    for (const columnName of columnsToRemove) {
      const column = table?.columns.find((col) => col.name === columnName);
      if (column) {
        console.log(`📝 Eliminando columna: ${columnName}`);
        await queryRunner.dropColumn('companies', columnName);
      }
    }

    console.log('✅ Migración revertida exitosamente');
  }
}

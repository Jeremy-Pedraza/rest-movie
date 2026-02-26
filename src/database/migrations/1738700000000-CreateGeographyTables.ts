// src/database/migrations/1738700000000-CreateGeographyTables.ts

/**
 * @fileoverview Migración para crear tablas del catálogo geográfico
 * @module database/migrations
 *
 * Crea las tablas:
 * - geo_countries: Países con información de internacionalización
 * - geo_departments: Departamentos/Estados/Provincias
 * - geo_cities: Ciudades/Municipios
 *
 * También agrega FKs opcionales a companies y stores
 */

import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
  TableColumn,
} from 'typeorm';

export class CreateGeographyTables1738700000000 implements MigrationInterface {
  name = 'CreateGeographyTables1738700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 Iniciando migración: CreateGeographyTables');

    // ============================================
    // CREAR TABLA geo_countries
    // ============================================

    const countriesTableExists = await queryRunner.hasTable('geo_countries');
    if (!countriesTableExists) {
      console.log('📝 Creando tabla: geo_countries');
      await queryRunner.createTable(
        new Table({
          name: 'geo_countries',
          schema: 'public',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            {
              name: 'code',
              type: 'varchar',
              length: '2',
              isUnique: true,
              isNullable: false,
              comment: 'Código ISO 3166-1 alpha-2',
            },
            {
              name: 'code_alpha3',
              type: 'varchar',
              length: '3',
              isUnique: true,
              isNullable: true,
              comment: 'Código ISO 3166-1 alpha-3',
            },
            {
              name: 'code_numeric',
              type: 'int',
              isNullable: true,
              comment: 'Código numérico ISO 3166-1',
            },
            {
              name: 'name',
              type: 'varchar',
              length: '100',
              isNullable: false,
              comment: 'Nombre en español',
            },
            {
              name: 'name_en',
              type: 'varchar',
              length: '100',
              isNullable: true,
              comment: 'Nombre en inglés',
            },
            {
              name: 'name_normalized',
              type: 'varchar',
              length: '100',
              isNullable: true,
              comment: 'Nombre sin tildes, lowercase',
            },
            {
              name: 'timezone',
              type: 'varchar',
              length: '50',
              isNullable: false,
              comment: 'Zona horaria IANA',
            },
            {
              name: 'currency_code',
              type: 'varchar',
              length: '3',
              isNullable: false,
              comment: 'Código ISO 4217 de moneda',
            },
            {
              name: 'currency_symbol',
              type: 'varchar',
              length: '10',
              isNullable: false,
              comment: 'Símbolo de moneda',
            },
            {
              name: 'phone_code',
              type: 'varchar',
              length: '10',
              isNullable: true,
              comment: 'Código telefónico internacional',
            },
            {
              name: 'tax_name',
              type: 'varchar',
              length: '20',
              isNullable: true,
              comment: 'Nombre del impuesto (ITBIS, IVA, etc)',
            },
            {
              name: 'tax_rate',
              type: 'decimal',
              precision: 5,
              scale: 4,
              isNullable: true,
              comment: 'Tasa de impuesto (0.18 = 18%)',
            },
            {
              name: 'date_format',
              type: 'varchar',
              length: '20',
              isNullable: true,
              default: "'DD/MM/YYYY'",
              comment: 'Formato de fecha preferido',
            },
            {
              name: 'language_code',
              type: 'varchar',
              length: '5',
              isNullable: true,
              default: "'es'",
              comment: 'Código de idioma ISO 639-1',
            },
            {
              name: 'display_order',
              type: 'int',
              isNullable: true,
              default: 100,
              comment: 'Orden de visualización',
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
              isNullable: true,
            },
          ],
        }),
        true,
      );

      // Índices para geo_countries
      await queryRunner.createIndices('geo_countries', [
        new TableIndex({ name: 'idx_geo_country_code', columnNames: ['code'], isUnique: true }),
        new TableIndex({ name: 'idx_geo_country_name', columnNames: ['name'] }),
        new TableIndex({ name: 'idx_geo_country_name_normalized', columnNames: ['name_normalized'] }),
        new TableIndex({ name: 'idx_geo_country_active', columnNames: ['is_active'] }),
      ]);
    }

    // ============================================
    // CREAR TABLA geo_departments
    // ============================================

    const deptsTableExists = await queryRunner.hasTable('geo_departments');
    if (!deptsTableExists) {
      console.log('📝 Creando tabla: geo_departments');
      await queryRunner.createTable(
        new Table({
          name: 'geo_departments',
          schema: 'public',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            {
              name: 'country_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'code',
              type: 'varchar',
              length: '10',
              isNullable: true,
              comment: 'Código local del departamento',
            },
            {
              name: 'iso_code',
              type: 'varchar',
              length: '10',
              isNullable: true,
              comment: 'Código ISO 3166-2',
            },
            {
              name: 'name',
              type: 'varchar',
              length: '100',
              isNullable: false,
            },
            {
              name: 'name_normalized',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'division_type',
              type: 'varchar',
              length: '30',
              isNullable: true,
              default: "'departamento'",
              comment: 'Tipo: provincia, departamento, estado, región',
            },
            {
              name: 'display_order',
              type: 'int',
              isNullable: true,
              default: 100,
            },
            {
              name: 'is_capital',
              type: 'boolean',
              default: false,
              comment: 'Es el departamento de la capital',
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
              isNullable: true,
            },
          ],
        }),
        true,
      );

      // Índices y FK para geo_departments
      await queryRunner.createIndices('geo_departments', [
        new TableIndex({ name: 'idx_geo_dept_country', columnNames: ['country_id'] }),
        new TableIndex({ name: 'idx_geo_dept_code', columnNames: ['code'] }),
        new TableIndex({ name: 'idx_geo_dept_name', columnNames: ['name'] }),
        new TableIndex({ name: 'idx_geo_dept_name_normalized', columnNames: ['name_normalized'] }),
        new TableIndex({ name: 'idx_geo_dept_active', columnNames: ['is_active'] }),
        new TableIndex({
          name: 'idx_geo_dept_country_name',
          columnNames: ['country_id', 'name'],
          isUnique: true,
        }),
      ]);

      await queryRunner.createForeignKey(
        'geo_departments',
        new TableForeignKey({
          name: 'fk_geo_dept_country',
          columnNames: ['country_id'],
          referencedTableName: 'geo_countries',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }

    // ============================================
    // CREAR TABLA geo_cities
    // ============================================

    const citiesTableExists = await queryRunner.hasTable('geo_cities');
    if (!citiesTableExists) {
      console.log('📝 Creando tabla: geo_cities');
      await queryRunner.createTable(
        new Table({
          name: 'geo_cities',
          schema: 'public',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            {
              name: 'department_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'name',
              type: 'varchar',
              length: '100',
              isNullable: false,
            },
            {
              name: 'name_normalized',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'aliases',
              type: 'text[]',
              isNullable: true,
              comment: 'Nombres alternativos para búsqueda',
            },
            {
              name: 'is_capital',
              type: 'boolean',
              default: false,
              comment: 'Es capital del departamento',
            },
            {
              name: 'is_country_capital',
              type: 'boolean',
              default: false,
              comment: 'Es capital del país',
            },
            {
              name: 'population',
              type: 'int',
              isNullable: true,
            },
            {
              name: 'timezone',
              type: 'varchar',
              length: '50',
              isNullable: true,
              comment: 'Zona horaria si difiere del país',
            },
            {
              name: 'postal_code',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'latitude',
              type: 'decimal',
              precision: 10,
              scale: 8,
              isNullable: true,
            },
            {
              name: 'longitude',
              type: 'decimal',
              precision: 11,
              scale: 8,
              isNullable: true,
            },
            {
              name: 'display_order',
              type: 'int',
              isNullable: true,
              default: 100,
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
              isNullable: true,
            },
          ],
        }),
        true,
      );

      // Índices y FK para geo_cities
      await queryRunner.createIndices('geo_cities', [
        new TableIndex({ name: 'idx_geo_city_dept', columnNames: ['department_id'] }),
        new TableIndex({ name: 'idx_geo_city_name', columnNames: ['name'] }),
        new TableIndex({ name: 'idx_geo_city_name_normalized', columnNames: ['name_normalized'] }),
        new TableIndex({ name: 'idx_geo_city_capital', columnNames: ['is_capital'] }),
        new TableIndex({ name: 'idx_geo_city_active', columnNames: ['is_active'] }),
        new TableIndex({
          name: 'idx_geo_city_dept_name',
          columnNames: ['department_id', 'name'],
          isUnique: true,
        }),
      ]);

      await queryRunner.createForeignKey(
        'geo_cities',
        new TableForeignKey({
          name: 'fk_geo_city_dept',
          columnNames: ['department_id'],
          referencedTableName: 'geo_departments',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }

    // ============================================
    // AGREGAR FK A COMPANIES
    // ============================================

    const companiesTable = await queryRunner.getTable('companies');
    const hasGeoCountryId = companiesTable?.columns.find((col) => col.name === 'geo_country_id');

    if (!hasGeoCountryId) {
      console.log('📝 Agregando columna geo_country_id a companies');
      await queryRunner.addColumn(
        'companies',
        new TableColumn({
          name: 'geo_country_id',
          type: 'uuid',
          isNullable: true,
          comment: 'Referencia al catálogo geográfico (opcional)',
        }),
      );

      await queryRunner.createIndex(
        'companies',
        new TableIndex({
          name: 'idx_company_geo_country',
          columnNames: ['geo_country_id'],
        }),
      );

      await queryRunner.createForeignKey(
        'companies',
        new TableForeignKey({
          name: 'fk_company_geo_country',
          columnNames: ['geo_country_id'],
          referencedTableName: 'geo_countries',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }

    // ============================================
    // AGREGAR FK A STORES
    // ============================================

    const storesTable = await queryRunner.getTable('stores');
    const hasGeoCityId = storesTable?.columns.find((col) => col.name === 'geo_city_id');

    if (!hasGeoCityId) {
      console.log('📝 Agregando columna geo_city_id a stores');
      await queryRunner.addColumn(
        'stores',
        new TableColumn({
          name: 'geo_city_id',
          type: 'uuid',
          isNullable: true,
          comment: 'Referencia al catálogo geográfico (opcional)',
        }),
      );

      await queryRunner.createIndex(
        'stores',
        new TableIndex({
          name: 'idx_store_geo_city',
          columnNames: ['geo_city_id'],
        }),
      );

      await queryRunner.createForeignKey(
        'stores',
        new TableForeignKey({
          name: 'fk_store_geo_city',
          columnNames: ['geo_city_id'],
          referencedTableName: 'geo_cities',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }

    // ============================================
    // RESUMEN
    // ============================================

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  MIGRACIÓN COMPLETADA: CreateGeographyTables               ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  ✅ geo_countries (catálogo de países)                     ║');
    console.log('║  ✅ geo_departments (departamentos/estados)                ║');
    console.log('║  ✅ geo_cities (ciudades)                                  ║');
    console.log('║  ✅ companies.geo_country_id (FK opcional)                 ║');
    console.log('║  ✅ stores.geo_city_id (FK opcional)                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Revirtiendo migración: CreateGeographyTables');

    // Eliminar FK de stores
    const storesTable = await queryRunner.getTable('stores');
    const storeFK = storesTable?.foreignKeys.find((fk) => fk.name === 'fk_store_geo_city');
    if (storeFK) {
      await queryRunner.dropForeignKey('stores', 'fk_store_geo_city');
    }
    const storeIndex = storesTable?.indices.find((idx) => idx.name === 'idx_store_geo_city');
    if (storeIndex) {
      await queryRunner.dropIndex('stores', 'idx_store_geo_city');
    }
    const storeCol = storesTable?.columns.find((col) => col.name === 'geo_city_id');
    if (storeCol) {
      await queryRunner.dropColumn('stores', 'geo_city_id');
    }

    // Eliminar FK de companies
    const companiesTable = await queryRunner.getTable('companies');
    const companyFK = companiesTable?.foreignKeys.find((fk) => fk.name === 'fk_company_geo_country');
    if (companyFK) {
      await queryRunner.dropForeignKey('companies', 'fk_company_geo_country');
    }
    const companyIndex = companiesTable?.indices.find((idx) => idx.name === 'idx_company_geo_country');
    if (companyIndex) {
      await queryRunner.dropIndex('companies', 'idx_company_geo_country');
    }
    const companyCol = companiesTable?.columns.find((col) => col.name === 'geo_country_id');
    if (companyCol) {
      await queryRunner.dropColumn('companies', 'geo_country_id');
    }

    // Eliminar tablas en orden inverso
    await queryRunner.dropTable('geo_cities', true);
    await queryRunner.dropTable('geo_departments', true);
    await queryRunner.dropTable('geo_countries', true);

    console.log('✅ Migración revertida exitosamente');
  }
}

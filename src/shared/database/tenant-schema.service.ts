// src/shared/database/tenant-schema.service.ts

/**
 * @fileoverview Servicio para gestión dinámica de schemas de tenant
 * @module shared/database
 *
 * Proporciona métodos para crear, clonar y eliminar schemas
 * de forma dinámica basándose en el template_tenant.
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { TenantSchemaEntity, TenantSchemaStatus } from './entities';

/**
 * Resultado de operaciones de schema
 */
export interface ISchemaOperationResult {
  success: boolean;
  schema: string;
  message: string;
  tables_created?: number;
  error?: string;
}

/**
 * Información de un schema
 */
export interface ISchemaInfo {
  schema_name: string;
  owner: string;
  tables_count: number;
  size_bytes: number;
  size_pretty: string;
  created_at?: Date;
  status?: TenantSchemaStatus;
}

/**
 * TenantSchemaService - Servicio para gestión de schemas multi-tenant
 *
 * Características:
 * - Crear schemas dinámicamente basados en template
 * - Clonar estructura de tablas (DDL only, sin datos)
 * - Eliminar schemas de forma segura
 * - Verificar existencia de schemas
 * - Obtener información de schemas
 * - Registrar schemas en tabla de control
 *
 * Arquitectura:
 * - Schema PUBLIC: Tablas compartidas (users, companies, stores, sessions)
 * - Schema TEMPLATE_TENANT: Template con estructura base
 * - Schema {COMPANY}: Tablas específicas del tenant (reportes, productos, etc.)
 *
 * @example
 * ```typescript
 * // Crear schema para nueva compañía
 * const result = await tenantSchemaService.createTenantSchema('taco_bell_rd', companyId);
 *
 * // Verificar si existe
 * const exists = await tenantSchemaService.schemaExists('taco_bell_rd');
 *
 * // Eliminar schema
 * await tenantSchemaService.dropTenantSchema('taco_bell_rd');
 * ```
 */
@Injectable()
export class TenantSchemaService {
  private readonly logger = new Logger(TenantSchemaService.name);

  /**
   * Nombre del schema template
   * Contiene la estructura base que se clona para cada tenant
   */
  private readonly TEMPLATE_SCHEMA = 'template_tenant';

  /**
   * Tablas que se clonan del template al schema del tenant
   * Estas tablas contienen datos específicos del tenant
   */
  private readonly TENANT_TABLES = [
    'report_headers',
    'sales_by_order_type',
    'payment_methods',
    'dynamic_discounts',
    'adjustments',
    'effective_orders',
    // Futuras tablas tenant:
    // 'products',
    // 'categories',
    // 'inventory',
    // 'orders',
    // 'order_items',
  ];

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(TenantSchemaEntity)
    private readonly tenantSchemaRepo: Repository<TenantSchemaEntity>,
  ) {}

  // ============================================
  // OPERACIONES PRINCIPALES
  // ============================================

  /**
   * Crear schema para un nuevo tenant
   *
   * Proceso:
   * 1. Validar nombre del schema
   * 2. Verificar que no exista
   * 3. Registrar en tabla de control (status: CREATING)
   * 4. Crear schema
   * 5. Clonar tablas del template
   * 6. Crear índices y constraints
   * 7. Actualizar registro (status: ACTIVE)
   *
   * @param schemaName - Nombre del schema a crear
   * @param companyId - UUID de la compañía (para registro)
   * @returns Resultado de la operación
   */
  async createTenantSchema(
    schemaName: string,
    companyId?: string,
  ): Promise<ISchemaOperationResult> {
    const normalizedName = this.normalizeSchemaName(schemaName);

    this.logger.log(`Iniciando creación de schema: ${normalizedName}`);

    // Validar nombre
    if (!this.isValidSchemaName(normalizedName)) {
      return {
        success: false,
        schema: normalizedName,
        message: 'Nombre de schema inválido',
        error: 'El nombre debe contener solo letras, números y guiones bajos',
      };
    }

    // Verificar que no exista
    if (await this.schemaExists(normalizedName)) {
      return {
        success: false,
        schema: normalizedName,
        message: 'El schema ya existe',
        error: `Schema '${normalizedName}' ya existe en la base de datos`,
      };
    }

    // Verificar que existe el template
    if (!(await this.schemaExists(this.TEMPLATE_SCHEMA))) {
      return {
        success: false,
        schema: normalizedName,
        message: 'Template no encontrado',
        error: `Schema template '${this.TEMPLATE_SCHEMA}' no existe. Ejecute la migración primero.`,
      };
    }

    // Registrar en tabla de control (si tenemos companyId)
    let schemaRecord: TenantSchemaEntity | null = null;
    if (companyId) {
      try {
        schemaRecord = this.tenantSchemaRepo.create({
          company_id: companyId,
          schema_name: normalizedName,
          status: TenantSchemaStatus.CREATING,
          tables_count: 0,
        });
        await this.tenantSchemaRepo.save(schemaRecord);
      } catch (error) {
        this.logger.warn(`No se pudo registrar schema en tabla de control: ${error}`);
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Crear schema
      await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${normalizedName}"`);
      this.logger.debug(`Schema ${normalizedName} creado`);

      // 2. Crear tipo enum si no existe
      const enumExists = await queryRunner.query(
        `
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE t.typname = 'report_type_enum' AND n.nspname = $1
      `,
        [normalizedName],
      );

      if (enumExists.length === 0) {
        await queryRunner.query(`
          CREATE TYPE "${normalizedName}"."report_type_enum" AS ENUM ('daily', 'weekly', 'monthly')
        `);
      }

      // 3. Clonar tablas del template
      let tablesCreated = 0;
      for (const tableName of this.TENANT_TABLES) {
        const tableExists = await this.tableExistsInSchema(
          queryRunner,
          this.TEMPLATE_SCHEMA,
          tableName,
        );

        if (tableExists) {
          await this.cloneTableStructure(queryRunner, tableName, normalizedName);
          tablesCreated++;
          this.logger.debug(`Tabla ${tableName} clonada a ${normalizedName}`);
        }
      }

      // 4. Commit
      await queryRunner.commitTransaction();

      // 5. Actualizar registro de control
      if (schemaRecord) {
        schemaRecord.status = TenantSchemaStatus.ACTIVE;
        schemaRecord.tables_count = tablesCreated;
        schemaRecord.last_synced_at = new Date();
        await this.tenantSchemaRepo.save(schemaRecord);
      }

      this.logger.log(`Schema ${normalizedName} creado exitosamente con ${tablesCreated} tablas`);

      return {
        success: true,
        schema: normalizedName,
        message: `Schema creado exitosamente`,
        tables_created: tablesCreated,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error creando schema ${normalizedName}:`, error);

      // Actualizar registro con error
      if (schemaRecord) {
        schemaRecord.status = TenantSchemaStatus.ERROR;
        schemaRecord.error_message = error instanceof Error ? error.message : String(error);
        await this.tenantSchemaRepo.save(schemaRecord);
      }

      return {
        success: false,
        schema: normalizedName,
        message: 'Error al crear schema',
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Eliminar schema de un tenant
   *
   * ADVERTENCIA: Esta operación es destructiva e irreversible
   *
   * @param schemaName - Nombre del schema a eliminar
   * @param force - Si es true, elimina aunque tenga datos
   * @returns Resultado de la operación
   */
  async dropTenantSchema(schemaName: string, force = false): Promise<ISchemaOperationResult> {
    const normalizedName = this.normalizeSchemaName(schemaName);

    this.logger.warn(`Solicitada eliminación de schema: ${normalizedName}`);

    // Proteger schemas del sistema
    if (this.isProtectedSchema(normalizedName)) {
      return {
        success: false,
        schema: normalizedName,
        message: 'Schema protegido',
        error: 'No se puede eliminar un schema del sistema',
      };
    }

    // Verificar que existe
    if (!(await this.schemaExists(normalizedName))) {
      return {
        success: false,
        schema: normalizedName,
        message: 'Schema no encontrado',
        error: `Schema '${normalizedName}' no existe`,
      };
    }

    // Actualizar estado a DELETING
    const schemaRecord = await this.tenantSchemaRepo.findOne({
      where: { schema_name: normalizedName },
    });

    if (schemaRecord) {
      schemaRecord.status = TenantSchemaStatus.DELETING;
      await this.tenantSchemaRepo.save(schemaRecord);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // DROP CASCADE elimina todas las tablas y objetos del schema
      const cascade = force ? 'CASCADE' : 'RESTRICT';
      await queryRunner.query(`DROP SCHEMA "${normalizedName}" ${cascade}`);

      // Eliminar registro de control
      if (schemaRecord) {
        await this.tenantSchemaRepo.remove(schemaRecord);
      }

      this.logger.warn(`Schema ${normalizedName} eliminado`);

      return {
        success: true,
        schema: normalizedName,
        message: 'Schema eliminado exitosamente',
      };
    } catch (error) {
      this.logger.error(`Error eliminando schema ${normalizedName}:`, error);

      // Restaurar estado anterior
      if (schemaRecord) {
        schemaRecord.status = TenantSchemaStatus.ERROR;
        schemaRecord.error_message = error instanceof Error ? error.message : String(error);
        await this.tenantSchemaRepo.save(schemaRecord);
      }

      return {
        success: false,
        schema: normalizedName,
        message: 'Error al eliminar schema',
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Verificar si un schema existe
   *
   * @param schemaName - Nombre del schema
   * @returns true si existe
   */
  async schemaExists(schemaName: string): Promise<boolean> {
    const normalizedName = this.normalizeSchemaName(schemaName);

    const result = await this.dataSource.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [normalizedName],
    );

    return result.length > 0;
  }

  /**
   * Obtener información de un schema
   *
   * @param schemaName - Nombre del schema
   * @returns Información del schema o null
   */
  async getSchemaInfo(schemaName: string): Promise<ISchemaInfo | null> {
    const normalizedName = this.normalizeSchemaName(schemaName);

    if (!(await this.schemaExists(normalizedName))) {
      return null;
    }

    // Obtener información básica
    const schemaResult = await this.dataSource.query(
      `
      SELECT 
        schema_name,
        schema_owner as owner
      FROM information_schema.schemata 
      WHERE schema_name = $1
      `,
      [normalizedName],
    );

    if (schemaResult.length === 0) return null;

    // Contar tablas
    const tablesResult = await this.dataSource.query(
      `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = $1
      `,
      [normalizedName],
    );

    // Obtener tamaño aproximado
    const sizeResult = await this.dataSource.query(
      `
      SELECT 
        COALESCE(SUM(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename))), 0) as size_bytes
      FROM pg_tables 
      WHERE schemaname = $1
      `,
      [normalizedName],
    );

    const sizeBytes = parseInt(sizeResult[0]?.size_bytes || '0');

    // Obtener estado del registro
    const schemaRecord = await this.tenantSchemaRepo.findOne({
      where: { schema_name: normalizedName },
    });

    return {
      schema_name: schemaResult[0].schema_name,
      owner: schemaResult[0].owner,
      tables_count: parseInt(tablesResult[0]?.count || '0'),
      size_bytes: sizeBytes,
      size_pretty: this.formatBytes(sizeBytes),
      created_at: schemaRecord?.created_at,
      status: schemaRecord?.status,
    };
  }

  /**
   * Listar todos los schemas de tenant
   *
   * @returns Lista de schemas (excluyendo sistema y template)
   */
  async listTenantSchemas(): Promise<ISchemaInfo[]> {
    // Obtener de la tabla de control
    const records = await this.tenantSchemaRepo.find({
      order: { created_at: 'DESC' },
    });

    return records.map((r) => ({
      schema_name: r.schema_name,
      owner: '',
      tables_count: r.tables_count,
      size_bytes: r.size_bytes || 0,
      size_pretty: this.formatBytes(r.size_bytes || 0),
      created_at: r.created_at,
      status: r.status,
    }));
  }

  /**
   * Obtener registro de schema por company_id
   *
   * @param companyId - UUID de la compañía
   * @returns TenantSchemaEntity o null
   */
  async getSchemaByCompanyId(companyId: string): Promise<TenantSchemaEntity | null> {
    return await this.tenantSchemaRepo.findOne({
      where: { company_id: companyId },
    });
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  /**
   * Clonar estructura de una tabla del template al schema destino
   */
  private async cloneTableStructure(
    queryRunner: QueryRunner,
    tableName: string,
    targetSchema: string,
  ): Promise<void> {
    // Usar CREATE TABLE ... LIKE para clonar estructura
    // Pero necesitamos manejar el tipo enum manualmente
    if (tableName === 'report_headers') {
      await queryRunner.query(`
        CREATE TABLE "${targetSchema}"."${tableName}" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "store_id" uuid NOT NULL,
          "report_date" date NOT NULL,
          "report_type" "${targetSchema}"."report_type_enum" NOT NULL DEFAULT 'daily',
          "total_sales" decimal(12,2) NOT NULL DEFAULT 0,
          "total_revenue" decimal(12,2) NOT NULL DEFAULT 0,
          "total_quantity" integer NOT NULL DEFAULT 0,
          "orders_count" integer NOT NULL DEFAULT 0,
          "average_ticket" decimal(10,2) NOT NULL DEFAULT 0,
          "total_discounts" decimal(12,2) NOT NULL DEFAULT 0,
          "total_adjustments" decimal(12,2) NOT NULL DEFAULT 0,
          "metadata" jsonb,
          "status" varchar(20) NOT NULL DEFAULT 'published',
          "created_at" timestamptz NOT NULL DEFAULT now(),
          "updated_at" timestamptz DEFAULT now(),
          CONSTRAINT "pk_${targetSchema}_report_headers" PRIMARY KEY ("id"),
          CONSTRAINT "uq_${targetSchema}_report_headers_store_date" UNIQUE ("store_id", "report_date")
        )
      `);

      // Índices
      await queryRunner.query(`
        CREATE INDEX "idx_${targetSchema}_report_headers_date" ON "${targetSchema}"."${tableName}" ("report_date")
      `);
      await queryRunner.query(`
        CREATE INDEX "idx_${targetSchema}_report_headers_type" ON "${targetSchema}"."${tableName}" ("report_type")
      `);
      await queryRunner.query(`
        CREATE INDEX "idx_${targetSchema}_report_headers_store_type" ON "${targetSchema}"."${tableName}" ("store_id", "report_type")
      `);
    } else {
      // Para otras tablas, usar LIKE
      await queryRunner.query(`
        CREATE TABLE "${targetSchema}"."${tableName}" 
        (LIKE "${this.TEMPLATE_SCHEMA}"."${tableName}" INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES)
      `);
    }

    // Agregar foreign keys
    await this.recreateForeignKeys(queryRunner, tableName, targetSchema);
  }

  /**
   * Recrear foreign keys que apuntan a schema public
   */
  private async recreateForeignKeys(
    queryRunner: QueryRunner,
    tableName: string,
    targetSchema: string,
  ): Promise<void> {
    // Para report_headers, necesita FK a stores (public)
    if (tableName === 'report_headers') {
      await queryRunner.query(`
        ALTER TABLE "${targetSchema}"."${tableName}"
        ADD CONSTRAINT "fk_${targetSchema}_report_headers_store"
        FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
      `);
    }

    // Para tablas de detalle, FK a report_headers del mismo schema
    const detailTables = [
      'sales_by_order_type',
      'payment_methods',
      'dynamic_discounts',
      'adjustments',
      'effective_orders',
    ];

    if (detailTables.includes(tableName)) {
      await queryRunner.query(`
        ALTER TABLE "${targetSchema}"."${tableName}"
        ADD CONSTRAINT "fk_${targetSchema}_${tableName}_report"
        FOREIGN KEY (report_header_id) REFERENCES "${targetSchema}".report_headers(id) ON DELETE CASCADE
      `);
    }
  }

  /**
   * Verificar si una tabla existe en un schema
   */
  private async tableExistsInSchema(
    queryRunner: QueryRunner,
    schemaName: string,
    tableName: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(
      `
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = $1 AND table_name = $2
      `,
      [schemaName, tableName],
    );
    return result.length > 0;
  }

  /**
   * Normalizar nombre de schema
   */
  private normalizeSchemaName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, '_');
  }

  /**
   * Validar nombre de schema
   */
  private isValidSchemaName(name: string): boolean {
    // Solo letras, números y guiones bajos
    // Debe empezar con letra
    // Longitud entre 3 y 63 caracteres
    const regex = /^[a-z][a-z0-9_]{2,62}$/;
    return regex.test(name);
  }

  /**
   * Verificar si es un schema protegido
   */
  private isProtectedSchema(name: string): boolean {
    const protected_schemas = [
      'public',
      'pg_catalog',
      'information_schema',
      'pg_toast',
      this.TEMPLATE_SCHEMA,
    ];
    return protected_schemas.includes(name) || name.startsWith('pg_');
  }

  /**
   * Formatear bytes a formato legible
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ============================================
  // MÉTODOS DE MANTENIMIENTO
  // ============================================

  /**
   * Sincronizar estructura de un schema con el template
   *
   * Útil cuando se agregan nuevas tablas al template y se quieren
   * propagar a schemas existentes.
   *
   * @param schemaName - Schema a sincronizar
   * @returns Resultado de la operación
   */
  async syncSchemaWithTemplate(schemaName: string): Promise<ISchemaOperationResult> {
    const normalizedName = this.normalizeSchemaName(schemaName);

    if (!(await this.schemaExists(normalizedName))) {
      return {
        success: false,
        schema: normalizedName,
        message: 'Schema no encontrado',
        error: `Schema '${normalizedName}' no existe`,
      };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let tablesCreated = 0;

      for (const tableName of this.TENANT_TABLES) {
        // Verificar si la tabla existe en el template
        const existsInTemplate = await this.tableExistsInSchema(
          queryRunner,
          this.TEMPLATE_SCHEMA,
          tableName,
        );

        if (!existsInTemplate) continue;

        // Verificar si ya existe en el schema destino
        const existsInTarget = await this.tableExistsInSchema(
          queryRunner,
          normalizedName,
          tableName,
        );

        if (!existsInTarget) {
          await this.cloneTableStructure(queryRunner, tableName, normalizedName);
          tablesCreated++;
          this.logger.debug(`Tabla ${tableName} sincronizada a ${normalizedName}`);
        }
      }

      await queryRunner.commitTransaction();

      // Actualizar registro
      const schemaRecord = await this.tenantSchemaRepo.findOne({
        where: { schema_name: normalizedName },
      });
      if (schemaRecord) {
        schemaRecord.last_synced_at = new Date();
        schemaRecord.tables_count = this.TENANT_TABLES.length;
        await this.tenantSchemaRepo.save(schemaRecord);
      }

      return {
        success: true,
        schema: normalizedName,
        message: `Schema sincronizado`,
        tables_created: tablesCreated,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error sincronizando schema ${normalizedName}:`, error);

      return {
        success: false,
        schema: normalizedName,
        message: 'Error al sincronizar schema',
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Verificar integridad del schema template
   */
  async verifyTemplateIntegrity(): Promise<{
    valid: boolean;
    missing_tables: string[];
    message: string;
  }> {
    if (!(await this.schemaExists(this.TEMPLATE_SCHEMA))) {
      return {
        valid: false,
        missing_tables: this.TENANT_TABLES,
        message: `Schema template '${this.TEMPLATE_SCHEMA}' no existe`,
      };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const missingTables: string[] = [];

      for (const tableName of this.TENANT_TABLES) {
        const exists = await this.tableExistsInSchema(queryRunner, this.TEMPLATE_SCHEMA, tableName);
        if (!exists) {
          missingTables.push(tableName);
        }
      }

      return {
        valid: missingTables.length === 0,
        missing_tables: missingTables,
        message:
          missingTables.length === 0
            ? 'Template válido'
            : `Faltan ${missingTables.length} tablas en el template`,
      };
    } finally {
      await queryRunner.release();
    }
  }
}

/**
 * @fileoverview Job de precalentamiento de cache
 * @module modules/tasks/jobs
 *
 * Precalienta el cache con datos frecuentemente accedidos.
 * Se ejecuta diariamente a las 6 AM por defecto.
 *
 * ✅ FASE 5 (Sesión 22): ACTUALIZADO para multi-tenant
 * - Itera sobre todos los tenants activos
 * - Keys incluyen schema para aislamiento
 * - Warmup por tenant + public
 *
 * @requires CacheService - Para poblar cache
 * @requires UserRepository - Para datos de usuarios
 * @requires TenantSchemaService - Para listar tenants activos
 */

import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { AuthRepository } from '@modules/auth/auth.repository';
import { CacheService } from '@modules/cache';
import { LoggerService, LogContext } from '@modules/logger';
import { UserRepository } from '@modules/user/user.repository';
import { TenantSchemaService } from '@shared/database';
import { TenantSchemaStatus } from '@shared/database/entities';
import { IJobExecutionResult } from '../interfaces';
import { CRON_EXPRESSIONS, DEFAULT_JOB_CONFIG, getEnvKey, JOB_NAMES } from '../tasks.constants';

interface WarmupResult {
  key: string;
  schema: string;
  success: boolean;
  duration: number;
  error?: string;
}

interface TenantWarmupSummary {
  schema: string;
  keysWarmed: number;
  errors: number;
  duration: number;
}

@Injectable()
export class CacheWarmupJob {
  private readonly logger = new Logger(CacheWarmupJob.name);
  private readonly jobName = JOB_NAMES.CACHE_WARMUP;
  private isRunning = false;

  constructor(
    private readonly cacheService: CacheService,
    private readonly userRepository: UserRepository,
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly tenantSchemaService: TenantSchemaService, // ✅ FASE 5: Multi-tenant
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {}

  /**
   * Verifica si el job está habilitado
   */
  private isEnabled(): boolean {
    const envKey = getEnvKey(this.jobName, 'enabled');
    const envValue = this.configService.get<string>(envKey);

    if (envValue !== undefined) {
      return envValue === 'true';
    }

    return DEFAULT_JOB_CONFIG[this.jobName]?.enabled ?? true;
  }

  /**
   * Obtiene el TTL por defecto para cache warmup
   */
  private getDefaultTtl(): number {
    return this.configService.get<number>('TASKS_CACHE_WARMUP_TTL') ?? 3600; // 1 hora
  }

  /**
   * Construye cache key con schema
   * @param schema - Schema del tenant
   * @param parts - Partes de la key
   * @returns Key con formato: {prefix}:{schema}:{parts}
   */
  private buildKey(schema: string, ...parts: string[]): string {
    return `${parts[0]}:${schema}:${parts.slice(1).join(':')}`;
  }

  /**
   * Construye tag con schema
   * @param tag - Nombre del tag
   * @param schema - Schema del tenant
   * @returns Tag con formato: {tag}:{schema}
   */
  private buildTag(tag: string, schema: string): string {
    return `${tag}:${schema}`;
  }

  /**
   * Obtiene lista de schemas activos para warmup
   * @returns Lista de schemas (incluye 'public')
   */
  private async getActiveSchemas(): Promise<string[]> {
    const schemas: string[] = ['public']; // Siempre incluir public

    try {
      const tenantSchemas = await this.tenantSchemaService.listTenantSchemas();
      const activeSchemas = tenantSchemas
        .filter((s) => s.status === TenantSchemaStatus.ACTIVE)
        .map((s) => s.schema_name);

      schemas.push(...activeSchemas);
    } catch {
      this.logWarn(
        `[${this.jobName}] No se pudieron obtener tenants activos, usando solo 'public'`,
      );
    }

    return schemas;
  }

  /**
   * Ejecuta el precalentamiento de cache
   * Cron: diario a las 6 AM (configurable via TASKS_CACHE_WARMUP_CRON)
   */
  @Cron(CRON_EXPRESSIONS.DAILY_6AM, {
    name: JOB_NAMES.CACHE_WARMUP,
  })
  async handleCron(): Promise<IJobExecutionResult> {
    return await this.execute();
  }

  /**
   * Ejecuta el job manualmente o desde el cron
   *
   * ✅ FASE 5 (Sesión 22): Itera sobre todos los tenants activos
   *
   * @param dryRun - Si es true, no realiza cambios reales
   */
  async execute(dryRun: boolean = false): Promise<IJobExecutionResult> {
    const startTime = Date.now();

    // Verificar si está habilitado
    if (!this.isEnabled()) {
      this.logger.debug(`[${this.jobName}] Job deshabilitado, saltando ejecución`);
      return {
        success: true,
        message: 'Job deshabilitado',
        duration: Date.now() - startTime,
        data: { skipped: true, reason: 'disabled' },
      };
    }

    // Evitar ejecuciones concurrentes
    if (this.isRunning) {
      this.logWarn(`[${this.jobName}] Job ya está en ejecución, saltando`);
      return {
        success: false,
        message: 'Job ya está en ejecución',
        duration: Date.now() - startTime,
        data: { skipped: true, reason: 'already_running' },
      };
    }

    this.isRunning = true;
    this.logger.log(`[${this.jobName}] Iniciando precalentamiento de cache multi-tenant...`);

    try {
      const ttl = this.getDefaultTtl();

      // ✅ FASE 5: Obtener todos los schemas activos
      const schemas = await this.getActiveSchemas();
      this.logger.log(`[${this.jobName}] Schemas a procesar: ${schemas.join(', ')}`);

      if (dryRun) {
        const keysToWarm = schemas.flatMap((schema) => [
          this.buildKey(schema, 'stats', 'users'),
          this.buildKey(schema, 'stats', 'sessions'),
          this.buildKey(schema, 'counts', 'global'),
        ]);

        this.logger.log(`[${this.jobName}] [DRY-RUN] Se precalentarían ${keysToWarm.length} keys:`);
        keysToWarm.forEach((key) => this.logger.log(`  - ${key}`));

        return {
          success: true,
          message: 'Dry-run: cache warmup simulado',
          duration: Date.now() - startTime,
          data: {
            dryRun: true,
            schemas,
            keysToWarm,
          },
        };
      }

      // ✅ FASE 5: Procesar cada schema
      const allResults: WarmupResult[] = [];
      const tenantSummaries: TenantWarmupSummary[] = [];

      for (const schema of schemas) {
        const schemaStartTime = Date.now();
        const schemaResults: WarmupResult[] = [];

        // 1. Estadísticas de usuarios para este tenant
        schemaResults.push(await this.warmupUserStats(ttl, schema));

        // 2. Estadísticas de sesiones para este tenant
        schemaResults.push(await this.warmupSessionStats(ttl, schema));

        // 3. Conteos para este tenant
        schemaResults.push(await this.warmupTenantCounts(ttl, schema));

        allResults.push(...schemaResults);

        const successCount = schemaResults.filter((r) => r.success).length;
        const errorCount = schemaResults.filter((r) => !r.success).length;

        tenantSummaries.push({
          schema,
          keysWarmed: successCount,
          errors: errorCount,
          duration: Date.now() - schemaStartTime,
        });

        this.logger.debug(
          `[${this.jobName}] Schema ${schema}: ${successCount} keys, ${errorCount} errores`,
        );
      }

      const totalSuccess = allResults.filter((r) => r.success).length;
      const totalErrors = allResults.filter((r) => !r.success).length;
      const duration = Date.now() - startTime;

      if (totalErrors > 0 && totalSuccess === 0) {
        return {
          success: false,
          message: `Cache warmup fallido: ${totalErrors} errores en ${schemas.length} schemas`,
          duration,
          error: {
            message: allResults
              .filter((r) => !r.success)
              .map((r) => `${r.key}: ${r.error}`)
              .join('; '),
          },
          data: { results: allResults, tenantSummaries },
        };
      }

      this.logger.log(
        `[${this.jobName}] Cache warmup completado: ${totalSuccess} keys en ${schemas.length} schemas, ${totalErrors} errores en ${duration}ms`,
      );

      return {
        success: totalErrors === 0,
        message:
          totalErrors > 0
            ? `Cache warmup parcial: ${totalSuccess} éxitos, ${totalErrors} errores en ${schemas.length} schemas`
            : `Cache warmup completado: ${totalSuccess} keys en ${schemas.length} schemas`,
        duration,
        metrics: {
          processed: allResults.length,
          affected: totalSuccess,
          errors: totalErrors,
        },
        data: {
          ttl,
          schemas,
          tenantSummaries,
          results: allResults,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      this.logError(`[${this.jobName}] Error en cache warmup: ${errorMessage}`);

      return {
        success: false,
        message: `Error en cache warmup: ${errorMessage}`,
        duration,
        error: {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        },
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Precalienta estadísticas de usuarios para un tenant
   *
   * ✅ FASE 5 (Sesión 22): Key incluye schema
   * Key: stats:{schema}:users
   * Tags: ['users:{schema}', 'stats:{schema}']
   *
   * @param ttl - Tiempo de vida del cache
   * @param schema - Schema del tenant
   */
  private async warmupUserStats(ttl: number, schema: string): Promise<WarmupResult> {
    const key = this.buildKey(schema, 'stats', 'users');
    const startTime = Date.now();

    try {
      // TODO: En el futuro, filtrar stats por schema si es necesario
      const stats = await this.userRepository.getStats();
      await this.cacheService.set(key, stats, ttl, [
        this.buildTag('users', schema),
        this.buildTag('stats', schema),
      ]);

      this.logger.debug(`[${this.jobName}] Precalentado: ${key}`);
      return {
        key,
        schema,
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      this.logWarn(`[${this.jobName}] Error precalentando ${key}: ${errorMsg}`);
      return {
        key,
        schema,
        success: false,
        duration: Date.now() - startTime,
        error: errorMsg,
      };
    }
  }

  /**
   * Precalienta estadísticas de sesiones para un tenant
   *
   * ✅ FASE 5 (Sesión 22): Key incluye schema
   * Key: stats:{schema}:sessions
   * Tags: ['sessions:{schema}', 'stats:{schema}']
   *
   * @param ttl - Tiempo de vida del cache
   * @param schema - Schema del tenant
   */
  private async warmupSessionStats(ttl: number, schema: string): Promise<WarmupResult> {
    const key = this.buildKey(schema, 'stats', 'sessions');
    const startTime = Date.now();

    try {
      // TODO: En el futuro, filtrar stats por schema si es necesario
      const stats = await this.authRepository.getStats();
      await this.cacheService.set(key, stats, ttl, [
        this.buildTag('sessions', schema),
        this.buildTag('stats', schema),
      ]);

      this.logger.debug(`[${this.jobName}] Precalentado: ${key}`);
      return {
        key,
        schema,
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      this.logWarn(`[${this.jobName}] Error precalentando ${key}: ${errorMsg}`);
      return {
        key,
        schema,
        success: false,
        duration: Date.now() - startTime,
        error: errorMsg,
      };
    }
  }

  /**
   * Precalienta conteos para un tenant
   *
   * ✅ FASE 5 (Sesión 22): Key incluye schema
   * Key: counts:{schema}:global
   * Tags: ['counts:{schema}', 'stats:{schema}']
   *
   * @param ttl - Tiempo de vida del cache
   * @param schema - Schema del tenant
   */
  private async warmupTenantCounts(ttl: number, schema: string): Promise<WarmupResult> {
    const key = this.buildKey(schema, 'counts', 'global');
    const startTime = Date.now();

    try {
      // TODO: En el futuro, filtrar count por schema si es necesario
      const [userCount] = await Promise.all([this.userRepository.count()]);

      const counts = {
        users: userCount,
        schema,
        updatedAt: new Date().toISOString(),
      };

      await this.cacheService.set(key, counts, ttl, [
        this.buildTag('counts', schema),
        this.buildTag('stats', schema),
      ]);

      this.logger.debug(`[${this.jobName}] Precalentado: ${key}`);
      return {
        key,
        schema,
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      this.logWarn(`[${this.jobName}] Error precalentando ${key}: ${errorMsg}`);
      return {
        key,
        schema,
        success: false,
        duration: Date.now() - startTime,
        error: errorMsg,
      };
    }
  }

  /**
   * Obtiene el estado actual del job
   */
  getStatus(): {
    isRunning: boolean;
    isEnabled: boolean;
    config: Record<string, unknown>;
  } {
    return {
      isRunning: this.isRunning,
      isEnabled: this.isEnabled(),
      config: {
        ...DEFAULT_JOB_CONFIG[this.jobName],
        currentTtl: this.getDefaultTtl(),
      },
    };
  }

  private logWarn(message: string): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.SYSTEM,
      service: CacheWarmupJob.name,
    });
  }

  private logError(message: string, details?: unknown): void {
    const stack = details instanceof Error ? details.stack : undefined;
    this.logger.error(message, stack);
    void this.loggerService?.error(message, {
      context: LogContext.SYSTEM,
      service: CacheWarmupJob.name,
      stack,
    });
  }
}


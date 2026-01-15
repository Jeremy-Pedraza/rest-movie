// src/modules/logger/logger.repository.ts

/**
 * @fileoverview Repository para logs
 * @module modules/logger
 *
 * ⚠️ REGLAS:
 * - Extiende BaseRepository para infraestructura multi-tenant
 * - Usa createStaticQueryBuilder() para queries en schema public
 * - SIEMPRE usar parámetros con :param syntax (previene SQL injection)
 * - NO usar query() con SQL raw
 * - NO tiene lógica de negocio
 *
 * 📋 ENTIDAD: logs (schema public)
 * - Los logs están en schema public (compartidos entre tenants)
 * - Por tanto, usa createStaticQueryBuilder() sin withSchema()
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseRepository } from '@shared/database/base.repository';
import { SchemaContext } from '@shared/database/schema.context';

import { LogEntity, LogLevel } from './entities/log.entity';
import { CreateLogDto, QueryLogDto, LogStatsQueryDto } from './dto';
import { IPaginatedResponse } from '@shared/common';

/**
 * Tipo para resultados raw de conteo
 */
interface CountResult {
  level: LogLevel;
  count: string;
}

/**
 * LoggerRepository - Repository para gestión de logs
 *
 * Extiende BaseRepository para tener infraestructura multi-tenant lista,
 * pero usa createStaticQueryBuilder() porque logs está en schema public.
 *
 * @example
 * ```typescript
 * // Buscar log (usa createStaticQueryBuilder para public)
 * const log = await this.loggerRepository.findById('log-id');
 * ```
 */
@Injectable()
export class LoggerRepository extends BaseRepository<LogEntity> {
  constructor(
    @InjectRepository(LogEntity)
    repository: Repository<LogEntity>,
    schemaContext: SchemaContext,
  ) {
    super(repository, schemaContext);
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Crea un nuevo log
   * @param dto - Datos del log
   * @returns Log creado
   */
  async create(dto: CreateLogDto): Promise<LogEntity> {
    const log = this.repository.create(dto);
    return this.repository.save(log);
  }

  /**
   * Crea múltiples logs en batch
   * @param dtos - Array de logs
   * @returns Logs creados
   */
  async createBatch(dtos: CreateLogDto[]): Promise<LogEntity[]> {
    const logs = this.repository.create(dtos);
    return this.repository.save(logs);
  }

  /**
   * Busca un log por ID
   * @param id - ID del log
   * @returns Log encontrado o null
   */
  async findById(id: string): Promise<LogEntity | null> {
    return this.createStaticQueryBuilder('log').where('log.id = :id', { id }).getOne();
  }

  /**
   * Busca logs con filtros y paginación
   * @param query - Filtros de búsqueda
   * @returns Logs paginados
   */
  async findAll(query: QueryLogDto): Promise<IPaginatedResponse<LogEntity>> {
    const {
      level,
      context,
      search,
      requestId,
      userId,
      service,
      errorCode,
      method,
      statusCode,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.createStaticQueryBuilder('log');

    // Aplicar filtros
    if (level) {
      qb.andWhere('log.level = :level', { level });
    }

    if (context) {
      qb.andWhere('log.context = :context', { context });
    }

    if (search) {
      qb.andWhere('log.message ILIKE :search', { search: `%${search}%` });
    }

    if (requestId) {
      qb.andWhere('log.request_id = :request_id', { request_id: requestId });
    }

    if (userId) {
      qb.andWhere('log.user_id = :user_id', { user_id: userId });
    }

    if (service) {
      qb.andWhere('log.service = :service', { service });
    }

    if (errorCode) {
      qb.andWhere('log.error_code = :error_code', { error_code: errorCode });
    }

    if (method) {
      qb.andWhere('log.method = :method', { method });
    }

    if (statusCode) {
      qb.andWhere('log.status_code = :status_code', { status_code: statusCode });
    }

    if (fromDate) {
      qb.andWhere('log.created_at >= :fromDate', { fromDate: new Date(fromDate) });
    }

    if (toDate) {
      qb.andWhere('log.created_at <= :toDate', { toDate: new Date(toDate) });
    }

    // Ordenamiento
    const validSortFields = ['created_at', 'level', 'context', 'status_code', 'response_time'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    qb.orderBy(`log.${orderField}`, sortOrder);

    // Paginación
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    // Ejecutar query
    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Busca logs por request ID (para tracing)
   * @param requestId - ID de la petición
   * @returns Logs de la petición
   */
  async findByRequestId(requestId: string): Promise<LogEntity[]> {
    return this.createStaticQueryBuilder('log')
      .where('log.request_id = :request_id', { request_id: requestId })
      .orderBy('log.created_at', 'ASC')
      .getMany();
  }

  /**
   * Busca logs por usuario
   * @param userId - ID del usuario
   * @param limit - Límite de resultados
   * @returns Logs del usuario
   */
  async findByUserId(userId: string, limit: number = 100): Promise<LogEntity[]> {
    return this.createStaticQueryBuilder('log')
      .where('log.user_id = :user_id', { user_id: userId })
      .orderBy('log.created_at', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Busca logs de errores recientes
   * @param hours - Horas hacia atrás
   * @param limit - Límite de resultados
   * @returns Logs de errores
   */
  async findRecentErrors(hours: number = 24, limit: number = 100): Promise<LogEntity[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.createStaticQueryBuilder('log')
      .where('log.level = :level', { level: LogLevel.ERROR })
      .andWhere('log.created_at >= :since', { since })
      .orderBy('log.created_at', 'DESC')
      .take(limit)
      .getMany();
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Obtiene estadísticas de logs
   * @param query - Filtros de estadísticas
   * @returns Estadísticas agrupadas
   */
  async getStats(query: LogStatsQueryDto): Promise<Record<string, unknown>[]> {
    const { fromDate, toDate, groupBy = 'level' } = query;

    const qb = this.createStaticQueryBuilder('log');

    // Filtros de fecha
    if (fromDate) {
      qb.andWhere('log.created_at >= :fromDate', { fromDate: new Date(fromDate) });
    }

    if (toDate) {
      qb.andWhere('log.created_at <= :toDate', { toDate: new Date(toDate) });
    }

    // Agrupación según el tipo
    switch (groupBy) {
      case 'level':
        qb.select('log.level', 'level').addSelect('COUNT(*)', 'count').groupBy('log.level');
        break;

      case 'context':
        qb.select('log.context', 'context').addSelect('COUNT(*)', 'count').groupBy('log.context');
        break;

      case 'hour':
        qb.select("DATE_TRUNC('hour', log.created_at)", 'hour')
          .addSelect('COUNT(*)', 'count')
          .groupBy("DATE_TRUNC('hour', log.created_at)")
          .orderBy('hour', 'DESC')
          .limit(24);
        break;

      case 'day':
        qb.select("DATE_TRUNC('day', log.created_at)", 'day')
          .addSelect('COUNT(*)', 'count')
          .groupBy("DATE_TRUNC('day', log.created_at)")
          .orderBy('day', 'DESC')
          .limit(30);
        break;
    }

    return qb.getRawMany();
  }

  /**
   * Obtiene conteo rápido por nivel
   * @returns Conteo por nivel
   */
  async getCountByLevel(): Promise<Record<LogLevel, number>> {
    const results = await this.createStaticQueryBuilder('log')
      .select('log.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.level')
      .getRawMany<CountResult>();

    const counts = {} as Record<LogLevel, number>;
    for (const level of Object.values(LogLevel)) {
      const found = results.find((r) => r.level === level);
      counts[level] = found ? parseInt(found.count, 10) : 0;
    }

    return counts;
  }

  /**
   * Obtiene promedio de tiempo de respuesta
   * @param hours - Horas hacia atrás
   * @returns Promedio en ms
   */
  async getAverageResponseTime(hours: number = 24): Promise<number> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const result = await this.createStaticQueryBuilder('log')
      .select('AVG(log.response_time)', 'avg')
      .where('log.response_time IS NOT NULL')
      .andWhere('log.created_at >= :since', { since })
      .getRawOne<{ avg: string | null }>();

    return result?.avg ? parseFloat(result.avg) : 0;
  }

  // ============================================
  // CLEANUP
  // ============================================

  /**
   * Elimina logs antiguos
   * @param days - Días de retención
   * @returns Número de logs eliminados
   */
  async deleteOldLogs(days: number = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Para operaciones DELETE bulk, usar this.repository.createQueryBuilder() directamente
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(LogEntity)
      .where('created_at < :cutoff', { cutoff })
      .execute();

    const deletedCount = result.affected ?? 0;
    this.logger.log(`Deleted ${deletedCount} logs older than ${days} days`);
    return result.affected || 0;
  }

  /**
   * Elimina logs por nivel (ej: solo debug en producción)
   * @param level - Nivel a eliminar
   * @param olderThanDays - Más antiguos que X días
   * @returns Número de logs eliminados
   */
  async deleteByLevel(level: LogLevel, olderThanDays: number = 7): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    // Para operaciones DELETE bulk, usar this.repository.createQueryBuilder() directamente
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(LogEntity)
      .where('level = :level', { level })
      .andWhere('created_at < :cutoff', { cutoff })
      .execute();

    const deletedCount = result.affected ?? 0;
    this.logger.log(`Deleted ${deletedCount} ${level} logs older than ${olderThanDays} days`);
    return result.affected || 0;
  }

  /**
   * Cuenta total de logs
   * @returns Total de logs
   */
  async count(): Promise<number> {
    return this.repository.count();
  }
}

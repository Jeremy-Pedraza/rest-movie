// src/modules/logger/logger.repository.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { LogEntity, LogLevel } from './entities/log.entity';
import { CreateLogDto, QueryLogDto, LogStatsQueryDto } from './dto';
import { IPaginatedResponse } from '@shared/common';

interface CountResult {
  level: LogLevel;
  count: string;
}

@Injectable()
export class LoggerRepository {
  private readonly logger = new Logger(LoggerRepository.name);

  constructor(
    @InjectRepository(LogEntity)
    private readonly repository: Repository<LogEntity>,
  ) {}

  async create(dto: CreateLogDto): Promise<LogEntity> {
    const log = this.repository.create(this.mapDtoToEntity(dto));
    return this.repository.save(log);
  }

  async createBatch(dtos: CreateLogDto[]): Promise<LogEntity[]> {
    const logs = this.repository.create(dtos.map((dto) => this.mapDtoToEntity(dto)));
    return this.repository.save(logs);
  }

  private mapDtoToEntity(dto: CreateLogDto): Partial<LogEntity> {
    return {
      level: dto.level,
      context: dto.context,
      message: dto.message,
      metadata: dto.metadata ?? null,
      stack: dto.stack ?? null,
      request_id: dto.requestId ?? null,
      user_id: dto.userId ?? null,
      ip: dto.ip ?? null,
      user_agent: dto.userAgent ?? null,
      method: dto.method ?? null,
      url: dto.url ?? null,
      status_code: dto.statusCode ?? null,
      response_time: dto.responseTime ?? null,
      service: dto.service ?? null,
      action: dto.action ?? null,
      error_code: dto.errorCode ?? null,
    };
  }

  async findById(id: string): Promise<LogEntity | null> {
    return this.createQueryBuilder('log').where('log.id = :id', { id }).getOne();
  }

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
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = query;

    const qb = this.createQueryBuilder('log');

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

    const validSortFields = ['created_at', 'level', 'context', 'status_code', 'response_time'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    qb.orderBy(`log.${orderField}`, sortOrder);

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

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

  async findByRequestId(requestId: string): Promise<LogEntity[]> {
    return this.createQueryBuilder('log')
      .where('log.request_id = :request_id', { request_id: requestId })
      .orderBy('log.created_at', 'ASC')
      .getMany();
  }

  async findByUserId(userId: string, limit: number = 100): Promise<LogEntity[]> {
    return this.createQueryBuilder('log')
      .where('log.user_id = :user_id', { user_id: userId })
      .orderBy('log.created_at', 'DESC')
      .take(limit)
      .getMany();
  }

  async findRecentErrors(hours: number = 24, limit: number = 100): Promise<LogEntity[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.createQueryBuilder('log')
      .where('log.level = :level', { level: LogLevel.ERROR })
      .andWhere('log.created_at >= :since', { since })
      .orderBy('log.created_at', 'DESC')
      .take(limit)
      .getMany();
  }

  async getStats(query: LogStatsQueryDto): Promise<Record<string, unknown>[]> {
    const { fromDate, toDate, groupBy = 'level' } = query;

    const qb = this.createQueryBuilder('log');

    if (fromDate) {
      qb.andWhere('log.created_at >= :fromDate', { fromDate: new Date(fromDate) });
    }
    if (toDate) {
      qb.andWhere('log.created_at <= :toDate', { toDate: new Date(toDate) });
    }

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

  async getCountByLevel(): Promise<Record<LogLevel, number>> {
    const results = await this.createQueryBuilder('log')
      .select('log.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.level')
      .getRawMany<CountResult>();

    const counts = {} as Record<LogLevel, number>;
    for (const level of Object.values(LogLevel)) {
      const found = results.find((r: CountResult) => r.level === level);
      counts[level] = found ? parseInt(found.count, 10) : 0;
    }

    return counts;
  }

  async getAverageResponseTime(hours: number = 24): Promise<number> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const result = await this.createQueryBuilder('log')
      .select('AVG(log.response_time)', 'avg')
      .where('log.response_time IS NOT NULL')
      .andWhere('log.created_at >= :since', { since })
      .getRawOne<{ avg: string | null }>();

    return result?.avg ? parseFloat(result.avg) : 0;
  }

  async deleteOldLogs(days: number = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(LogEntity)
      .where('created_at < :cutoff', { cutoff })
      .execute();

    const deletedCount = result.affected ?? 0;
    this.logger.log(`Deleted ${deletedCount} logs older than ${days} days`);
    return deletedCount;
  }

  async deleteByLevel(level: LogLevel, olderThanDays: number = 7): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(LogEntity)
      .where('level = :level', { level })
      .andWhere('created_at < :cutoff', { cutoff })
      .execute();

    const deletedCount = result.affected ?? 0;
    this.logger.log(`Deleted ${deletedCount} ${level} logs older than ${olderThanDays} days`);
    return deletedCount;
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  private createQueryBuilder(alias: string): SelectQueryBuilder<LogEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}

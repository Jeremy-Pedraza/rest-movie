// src/modules/logger/logger.service.ts

/**
 * @fileoverview Service para logging persistente
 * @module modules/logger
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LOGGER_DEFAULTS, LOGGER_REDACT_KEYS } from '@constants';
import { ERROR_CODES } from '@constants/error-codes.constant';
import { LoggerRepository } from './logger.repository';
import { LogEntity, LogLevel, LogContext } from './entities/log.entity';
import { CreateLogDto, QueryLogDto, LogStatsQueryDto } from './dto';
import { IPaginatedResponse } from '@shared/common/interfaces/paginated-response.interface';
import { LogDbLevel } from '@config/app.config';

/**
 * Opciones para crear un log simplificado
 */
interface LogOptions {
  context?: LogContext;
  metadata?: Record<string, unknown>;
  requestId?: string;
  userId?: string;
  service?: string;
  action?: string;
  errorCode?: string;
  stack?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
}

@Injectable()
export class LoggerService {
  private readonly logger = new Logger(LoggerService.name);
  private readonly dbLevel: LogDbLevel;
  private buffer: CreateLogDto[] = [];
  private readonly bufferSize = LOGGER_DEFAULTS.BUFFER_SIZE;
  private flushTimeout: NodeJS.Timeout | null = null;
  private readonly flushInterval = LOGGER_DEFAULTS.FLUSH_INTERVAL_MS;

  constructor(
    private readonly repository: LoggerRepository,
    private readonly configService: ConfigService,
  ) {
    this.dbLevel = this.configService.get<LogDbLevel>('app.logging.dbLevel') || 'info';
    // Auto-flush periódico
    this.startAutoFlush();
  }

  // ============================================
  // LOGGING METHODS
  // ============================================

  /**
   * Log de error
   * @param message - Mensaje
   * @param options - Opciones adicionales
   */
  async error(message: string, options: LogOptions = {}): Promise<void> {
    await this.log(LogLevel.ERROR, message, options);
  }

  /**
   * Log de warning
   * @param message - Mensaje
   * @param options - Opciones adicionales
   */
  async warn(message: string, options: LogOptions = {}): Promise<void> {
    await this.log(LogLevel.WARN, message, options);
  }

  /**
   * Log de info
   * @param message - Mensaje
   * @param options - Opciones adicionales
   */
  async info(message: string, options: LogOptions = {}): Promise<void> {
    await this.log(LogLevel.INFO, message, options);
  }

  /**
   * Log de debug
   * @param message - Mensaje
   * @param options - Opciones adicionales
   */
  async debug(message: string, options: LogOptions = {}): Promise<void> {
    await this.log(LogLevel.DEBUG, message, options);
  }

  /**
   * Log de verbose
   * @param message - Mensaje
   * @param options - Opciones adicionales
   */
  async verbose(message: string, options: LogOptions = {}): Promise<void> {
    await this.log(LogLevel.VERBOSE, message, options);
  }

  /**
   * Log genérico
   * @param level - Nivel del log
   * @param message - Mensaje
   * @param options - Opciones adicionales
   */
  async log(level: LogLevel, message: string, options: LogOptions = {}): Promise<void> {
    if (!this.shouldPersistLevel(level)) {
      return;
    }

    const sanitizedMessage = this.redactText(message);
    const sanitizedMetadata = this.redactMetadata(options.metadata);

    const dto: CreateLogDto = {
      level,
      message: sanitizedMessage,
      context: options.context || LogContext.SYSTEM,
      metadata: sanitizedMetadata,
      requestId: options.requestId,
      userId: options.userId,
      service: options.service,
      action: options.action,
      errorCode: options.errorCode,
      stack: options.stack ? this.redactText(options.stack) : undefined,
      ip: options.ip ? this.maskIp(options.ip) : undefined,
      userAgent: options.userAgent ? this.redactText(options.userAgent) : undefined,
      method: options.method,
      url: options.url ? this.redactUrl(options.url) : undefined,
      statusCode: options.statusCode,
      responseTime: options.responseTime,
    };

    // Agregar al buffer
    this.buffer.push(dto);

    // Flush si el buffer está lleno
    if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    }
  }

  /**
   * Determina si un nivel debe persistirse en BD según la política configurada.
   */
  private shouldPersistLevel(level: LogLevel): boolean {
    switch (this.dbLevel) {
      case 'none':
        return false;
      case 'errors':
        return level === LogLevel.ERROR;
      case 'warnings':
        return level === LogLevel.ERROR || level === LogLevel.WARN;
      case 'info':
        return level === LogLevel.ERROR || level === LogLevel.WARN || level === LogLevel.INFO;
      case 'all':
      default:
        return true;
    }
  }

  /**
   * Log de petición HTTP
   * @param data - Datos de la petición
   */
  async logHttpRequest(data: {
    method: string;
    url: string;
    statusCode: number;
    responseTime: number;
    requestId?: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    const level =
      data.statusCode >= 500
        ? LogLevel.ERROR
        : data.statusCode >= 400
          ? LogLevel.WARN
          : LogLevel.INFO;

    await this.log(level, `${data.method} ${data.url} ${data.statusCode}`, {
      context: LogContext.HTTP,
      ...data,
    });
  }

  /**
   * Log de error de base de datos
   * @param message - Mensaje
   * @param error - Error
   * @param options - Opciones adicionales
   */
  async logDatabaseError(message: string, error: Error, options: LogOptions = {}): Promise<void> {
    await this.error(message, {
      ...options,
      context: LogContext.DATABASE,
      stack: error.stack,
      metadata: {
        ...options.metadata,
        errorName: error.name,
        errorMessage: error.message,
      },
    });
  }

  /**
   * Log de autenticación
   * @param message - Mensaje
   * @param success - Si fue exitoso
   * @param options - Opciones adicionales
   */
  async logAuth(message: string, success: boolean, options: LogOptions = {}): Promise<void> {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    await this.log(level, message, {
      ...options,
      context: LogContext.AUTH,
      metadata: {
        ...options.metadata,
        success,
      },
    });
  }

  /**
   * Log de operación de negocio
   * @param message - Mensaje
   * @param options - Opciones adicionales
   */
  async logBusiness(message: string, options: LogOptions = {}): Promise<void> {
    await this.info(message, {
      ...options,
      context: LogContext.BUSINESS,
    });
  }

  // ============================================
  // BUFFER MANAGEMENT
  // ============================================

  /**
   * Vacía el buffer y guarda los logs en BD
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logsToSave = [...this.buffer];
    this.buffer = [];

    try {
      await this.repository.createBatch(logsToSave);
      this.logger.debug(`Flushed ${logsToSave.length} logs to database`);
    } catch (error) {
      // Si falla, devolver al buffer
      this.buffer = [...logsToSave, ...this.buffer];
      this.logger.error('Failed to flush logs to database', error);
    }
  }

  /**
   * Inicia el auto-flush periódico
   */
  private startAutoFlush(): void {
    this.flushTimeout = setInterval(() => {
      void this.flush();
    }, this.flushInterval);
  }

  /**
   * Detiene el auto-flush
   */
  async stopAutoFlush(): Promise<void> {
    if (this.flushTimeout) {
      clearInterval(this.flushTimeout);
      this.flushTimeout = null;
    }
    // Flush final
    await this.flush();
  }

  private redactMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!metadata) {
      return undefined;
    }

    return Object.entries(metadata).reduce<Record<string, unknown>>((acc, [key, value]) => {
      const normalizedKey = key.toLowerCase();
      if (LOGGER_REDACT_KEYS.some((sensitiveKey) => normalizedKey.includes(sensitiveKey))) {
        acc[key] = '[REDACTED]';
        return acc;
      }

      acc[key] =
        typeof value === 'string'
          ? this.redactText(value)
          : Array.isArray(value)
            ? value.map((item) => (typeof item === 'string' ? this.redactText(item) : item))
            : value;
      return acc;
    }, {});
  }

  private redactText(value: string): string {
    return value
      .replace(/(authorization|token|password|secret)=([^&\s]+)/gi, '$1=[REDACTED]')
      .replace(/bearer\s+[a-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]');
  }

  private redactUrl(value: string): string {
    return value.replace(
      /([?&](token|password|secret|authorization|refreshToken)=)([^&]+)/gi,
      '$1[REDACTED]',
    );
  }

  private maskIp(value: string): string {
    if (value.includes(':')) {
      return value.split(':').slice(0, 4).join(':') + '::';
    }

    const parts = value.split('.');
    if (parts.length !== 4) {
      return '[REDACTED_IP]';
    }

    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  /**
   * Busca logs con filtros
   * @param query - Filtros
   * @returns Logs paginados
   */
  async findAll(query: QueryLogDto): Promise<IPaginatedResponse<LogEntity>> {
    return this.repository.findAll(query);
  }

  /**
   * Busca un log por ID
   * @param id - ID del log
   * @returns Log encontrado o null
   */
  async findById(id: string): Promise<LogEntity | null> {
    return this.repository.findById(id);
  }

  async findByIdOrFail(id: string): Promise<LogEntity> {
    const log = await this.repository.findById(id);
    if (!log) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        message: `Log con ID '${id}' no encontrado`,
        error: 'Not Found',
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
      });
    }
    return log;
  }

  /**
   * Busca logs por request ID (tracing)
   * @param requestId - ID de la petición
   * @returns Logs de la petición
   */
  async findByRequestId(requestId: string): Promise<LogEntity[]> {
    return this.repository.findByRequestId(requestId);
  }

  /**
   * Busca logs por usuario
   * @param userId - ID del usuario
   * @param limit - Límite
   * @returns Logs del usuario
   */
  async findByUserId(userId: string, limit?: number): Promise<LogEntity[]> {
    return this.repository.findByUserId(userId, limit);
  }

  /**
   * Busca errores recientes
   * @param hours - Horas hacia atrás
   * @param limit - Límite
   * @returns Logs de errores
   */
  async findRecentErrors(hours?: number, limit?: number): Promise<LogEntity[]> {
    return this.repository.findRecentErrors(hours, limit);
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Obtiene estadísticas de logs
   * @param query - Filtros
   * @returns Estadísticas
   */
  async getStats(query: LogStatsQueryDto): Promise<Record<string, unknown>[]> {
    return this.repository.getStats(query);
  }

  /**
   * Obtiene conteo por nivel
   * @returns Conteo por nivel
   */
  async getCountByLevel(): Promise<Record<LogLevel, number>> {
    return this.repository.getCountByLevel();
  }

  /**
   * Obtiene promedio de tiempo de respuesta
   * @param hours - Horas hacia atrás
   * @returns Promedio en ms
   */
  async getAverageResponseTime(hours?: number): Promise<number> {
    return this.repository.getAverageResponseTime(hours);
  }

  /**
   * Obtiene resumen de logs
   * @returns Resumen
   */
  async getSummary(): Promise<Record<string, unknown>> {
    const [countByLevel, avgResponseTime, totalCount, recentErrors] = await Promise.all([
      this.getCountByLevel(),
      this.getAverageResponseTime(24),
      this.repository.count(),
      this.findRecentErrors(1, 5),
    ]);

    return {
      total: totalCount,
      byLevel: countByLevel,
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      recentErrorsCount: recentErrors.length,
      bufferSize: this.buffer.length,
    };
  }

  // ============================================
  // CLEANUP
  // ============================================

  /**
   * Elimina logs antiguos
   * @param days - Días de retención
   * @returns Número de logs eliminados
   */
  async deleteOldLogs(days?: number): Promise<number> {
    return this.repository.deleteOldLogs(days);
  }

  /**
   * Elimina logs de debug antiguos
   * @param days - Días de retención
   * @returns Número de logs eliminados
   */
  async cleanupDebugLogs(days: number = 3): Promise<number> {
    const debugDeleted = await this.repository.deleteByLevel(LogLevel.DEBUG, days);
    const verboseDeleted = await this.repository.deleteByLevel(LogLevel.VERBOSE, days);
    return debugDeleted + verboseDeleted;
  }
}

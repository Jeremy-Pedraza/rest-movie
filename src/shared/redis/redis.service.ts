// src/shared/redis/redis.service.ts

/**
 * @fileoverview Servicio de operaciones Redis
 * @module shared/redis
 * @description Wrapper sobre ioredis con operaciones comunes y tipadas
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { LoggerService, LogContext } from '@modules/logger';

/**
 * Opciones para operaciones con TTL
 */
export interface SetOptions {
  /** Time to live en segundos */
  ttl?: number;
  /** Solo setear si no existe */
  nx?: boolean;
  /** Solo setear si existe */
  xx?: boolean;
}

/**
 * Opciones para escaneo de claves
 */
export interface ScanOptions {
  /** Patrón de búsqueda */
  pattern?: string;
  /** Cantidad por iteración */
  count?: number;
  /** Límite máximo de keys a retornar (0 = sin límite) */
  maxResults?: number;
}

/**
 * Resultado paginado de SCAN
 */
export interface ScanPageResult {
  /** Keys encontradas en esta página */
  keys: string[];
  /** Cursor para la siguiente página ('0' si no hay más) */
  nextCursor: string;
  /** Si hay más resultados disponibles */
  hasMore: boolean;
}

/**
 * Resultado de operación con información adicional
 */
export interface RedisResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;
  private isConnected = false;
  private readonly defaultTTL: number;
  private readonly errorPolicy: 'fail-open' | 'fail-fast';

  /** Dispatcher de suscripciones Pub/Sub: channel -> Set<callbacks> */
  private readonly subscriptionHandlers = new Map<
    string,
    Set<(message: string, channel: string) => void>
  >();
  private messageListenerAttached = false;

  /** Single-flight: previene cache stampede en getOrSet concurrente */
  private readonly inflightRequests = new Map<string, Promise<any>>();

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {
    this.defaultTTL = this.configService.get<number>('redis.ttl') || 3600;
    this.errorPolicy = this.configService.get<'fail-open' | 'fail-fast'>('redis.errorPolicy') || 'fail-open';
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  /**
   * Conecta al servidor Redis
   */
  async connect(): Promise<void> {
    try {
      const maxRetries = this.configService.get<number>('redis.maxRetries') || 10;
      const retryDelayMs = this.configService.get<number>('redis.retryDelayMs') || 200;
      const retryMaxDelayMs = this.configService.get<number>('redis.retryMaxDelayMs') || 5000;
      const maxRetriesPerRequest = this.configService.get<number>('redis.maxRetriesPerRequest') || 3;
      const enableOfflineQueue = this.configService.get<boolean>('redis.enableOfflineQueue') !== false;

      const options: RedisOptions = {
        host: this.configService.get<string>('redis.host') || 'localhost',
        port: this.configService.get<number>('redis.port') || 6379,
        password: this.configService.get<string>('redis.password') || undefined,
        db: this.configService.get<number>('redis.db') || 0,
        retryStrategy: (times: number) => {
          if (times > maxRetries) {
            this.logError(`Redis connection failed after ${maxRetries} retries`);
            return null;
          }
          const delay = Math.min(times * retryDelayMs, retryMaxDelayMs);
          this.logWarn(`Redis reconnecting... attempt ${times}, delay ${delay}ms`);
          return delay;
        },
        maxRetriesPerRequest,
        enableReadyCheck: true,
        lazyConnect: false,
        enableOfflineQueue,
        reconnectOnError: (err) => {
          const targetErrors = ['READONLY', 'LOADING'];
          return targetErrors.some((e) => err.message.includes(e));
        },
      };

      this.client = new Redis(options);
      this.subscriber = new Redis(options);

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('🔌 Redis client connected');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        this.logError(`Redis client error: ${error.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.logWarn('Redis connection closed');
      });

      // Esperar conexión
      await this.client.ping();
      this.logger.log('🔌 Redis connection established');
    } catch (error) {
      this.logError(`Failed to connect to Redis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desconecta del servidor Redis
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
      }
      if (this.subscriber) {
        await this.subscriber.quit();
      }
      this.isConnected = false;
      this.logger.log('Redis disconnected');
    } catch (error) {
      this.logError(`Error disconnecting from Redis: ${error.message}`);
    }
  }

  /**
   * Verifica si está conectado
   */
  isReady(): boolean {
    return this.isConnected && this.client?.status === 'ready';
  }

  /**
   * Obtiene el cliente Redis nativo
   */
  getClient(): Redis {
    return this.client;
  }

  // ============================================
  // STRING OPERATIONS
  // ============================================

  /**
   * Obtiene un valor por clave
   * @param key - Clave
   * @returns Valor o null
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logError(`Redis GET error for key ${key}: ${error.message}`);
      if (this.errorPolicy === 'fail-fast') throw error;
      return null;
    }
  }

  /**
   * Obtiene un valor y lo parsea como JSON
   * @param key - Clave
   * @returns Objeto parseado o null
   */
  async getJson<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logError(`Redis GET JSON error for key ${key}: ${error.message}`);
      if (this.errorPolicy === 'fail-fast') throw error;
      return null;
    }
  }

  /**
   * Establece un valor
   * @param key - Clave
   * @param value - Valor
   * @param options - Opciones (TTL, NX, XX)
   * @returns true si se estableció correctamente
   */
  async set(key: string, value: string | number, options?: SetOptions): Promise<boolean> {
    try {
      let result: string | null;
      const valueStr = value.toString();

      if (options?.ttl && options?.nx) {
        result = await this.client.set(key, valueStr, 'EX', options.ttl, 'NX');
      } else if (options?.ttl && options?.xx) {
        result = await this.client.set(key, valueStr, 'EX', options.ttl, 'XX');
      } else if (options?.ttl) {
        result = await this.client.set(key, valueStr, 'EX', options.ttl);
      } else if (options?.nx) {
        result = await this.client.set(key, valueStr, 'NX');
      } else if (options?.xx) {
        result = await this.client.set(key, valueStr, 'XX');
      } else {
        result = await this.client.set(key, valueStr);
      }

      return result === 'OK';
    } catch (error) {
      this.logError(`Redis SET error for key ${key}: ${error.message}`);
      if (this.errorPolicy === 'fail-fast') throw error;
      return false;
    }
  }

  /**
   * Establece un valor como JSON
   * @param key - Clave
   * @param value - Objeto a serializar
   * @param options - Opciones
   * @returns true si se estableció correctamente
   */
  async setJson<T = any>(key: string, value: T, options?: SetOptions): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      return await this.set(key, serialized, options);
    } catch (error) {
      this.logError(`Redis SET JSON error for key ${key}: ${error.message}`);
      if (this.errorPolicy === 'fail-fast') throw error;
      return false;
    }
  }

  /**
   * Establece un valor con TTL por defecto
   * @param key - Clave
   * @param value - Valor
   * @param ttl - TTL en segundos (default: configurado)
   */
  async setEx(key: string, value: string | number, ttl?: number): Promise<boolean> {
    return this.set(key, value, { ttl: ttl || this.defaultTTL });
  }

  /**
   * Establece solo si no existe (Set if Not eXists)
   * @param key - Clave
   * @param value - Valor
   * @param ttl - TTL opcional
   * @returns true si se estableció (no existía)
   */
  async setNx(key: string, value: string | number, ttl?: number): Promise<boolean> {
    return this.set(key, value, { nx: true, ttl });
  }

  /**
   * Obtiene múltiples valores
   * @param keys - Array de claves
   * @returns Array de valores (null para no encontrados)
   */
  async mGet(keys: string[]): Promise<(string | null)[]> {
    try {
      if (keys.length === 0) return [];
      return await this.client.mget(keys);
    } catch (error) {
      this.logError(`Redis MGET error: ${error.message}`);
      return keys.map(() => null);
    }
  }

  /**
   * Establece múltiples valores
   * @param pairs - Objeto clave-valor
   * @returns true si se establecieron correctamente
   */
  async mSet(pairs: Record<string, string | number>): Promise<boolean> {
    try {
      const entries = Object.entries(pairs);
      if (entries.length === 0) return true;
      const mapped: Record<string, string> = {};
      for (const [key, value] of entries) {
        mapped[key] = value.toString();
      }
      const result = await this.client.mset(mapped);
      return result === 'OK';
    } catch (error) {
      this.logError(`Redis MSET error: ${error.message}`);
      return false;
    }
  }

  /**
   * Incrementa un valor numérico
   * @param key - Clave
   * @param increment - Valor a incrementar (default: 1)
   * @returns Nuevo valor
   */
  async incr(key: string, increment: number = 1): Promise<number> {
    try {
      if (increment === 1) {
        return await this.client.incr(key);
      }
      return await this.client.incrby(key, increment);
    } catch (error) {
      this.logError(`Redis INCR error for key ${key}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Decrementa un valor numérico
   * @param key - Clave
   * @param decrement - Valor a decrementar (default: 1)
   * @returns Nuevo valor
   */
  async decr(key: string, decrement: number = 1): Promise<number> {
    try {
      if (decrement === 1) {
        return await this.client.decr(key);
      }
      return await this.client.decrby(key, decrement);
    } catch (error) {
      this.logError(`Redis DECR error for key ${key}: ${error.message}`);
      return 0;
    }
  }

  // ============================================
  // KEY OPERATIONS
  // ============================================

  /**
   * Elimina una o más claves
   * @param keys - Clave o claves a eliminar
   * @returns Número de claves eliminadas
   */
  async del(...keys: string[]): Promise<number> {
    try {
      if (keys.length === 0) return 0;
      return await this.client.del(...keys);
    } catch (error) {
      this.logError(`Redis DEL error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Verifica si una clave existe
   * @param key - Clave
   * @returns true si existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logError(`Redis EXISTS error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Establece tiempo de expiración en segundos
   * @param key - Clave
   * @param seconds - Segundos hasta expirar
   * @returns true si se estableció correctamente
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      this.logError(`Redis EXPIRE error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Establece tiempo de expiración como timestamp
   * @param key - Clave
   * @param timestamp - Timestamp Unix
   * @returns true si se estableció correctamente
   */
  async expireAt(key: string, timestamp: number): Promise<boolean> {
    try {
      const result = await this.client.expireat(key, timestamp);
      return result === 1;
    } catch (error) {
      this.logError(`Redis EXPIREAT error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtiene el TTL de una clave en segundos
   * @param key - Clave
   * @returns TTL en segundos, -1 si no tiene, -2 si no existe
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logError(`Redis TTL error for key ${key}: ${error.message}`);
      return -2;
    }
  }

  /**
   * Elimina el tiempo de expiración de una clave
   * @param key - Clave
   * @returns true si se eliminó correctamente
   */
  async persist(key: string): Promise<boolean> {
    try {
      const result = await this.client.persist(key);
      return result === 1;
    } catch (error) {
      this.logError(`Redis PERSIST error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Busca claves por patrón usando SCAN (seguro para producción)
   * @deprecated Usar scan() o scanPage() en su lugar para control explícito
   * @param pattern - Patrón de búsqueda (ej: "user:*")
   * @returns Array de claves encontradas
   */
  async keys(pattern: string): Promise<string[]> {
    return this.scan({ pattern });
  }

  /**
   * Escanea claves de forma segura (no bloquea)
   * @param options - Opciones de escaneo
   * @returns Array de claves encontradas
   */
  async scan(options: ScanOptions = {}): Promise<string[]> {
    try {
      const { pattern = '*', count = 100, maxResults = 0 } = options;
      const keys: string[] = [];
      let cursor = '0';

      do {
        const [newCursor, foundKeys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          count,
        );
        cursor = newCursor;
        keys.push(...foundKeys);

        if (maxResults > 0 && keys.length >= maxResults) {
          return keys.slice(0, maxResults);
        }
      } while (cursor !== '0');

      return keys;
    } catch (error) {
      this.logError(`Redis SCAN error: ${error.message}`);
      return [];
    }
  }

  /**
   * Escaneo paginado por cursor (ideal para endpoints)
   * @param cursor - Cursor de inicio ('0' para la primera página)
   * @param options - Opciones de escaneo
   * @returns Página de resultados con cursor para la siguiente
   */
  async scanPage(cursor: string = '0', options: ScanOptions = {}): Promise<ScanPageResult> {
    try {
      const { pattern = '*', count = 100 } = options;
      const [newCursor, foundKeys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        count,
      );

      return {
        keys: foundKeys,
        nextCursor: newCursor,
        hasMore: newCursor !== '0',
      };
    } catch (error) {
      this.logError(`Redis SCAN PAGE error: ${error.message}`);
      return { keys: [], nextCursor: '0', hasMore: false };
    }
  }

  /**
   * Renombra una clave
   * @param oldKey - Clave actual
   * @param newKey - Nueva clave
   * @returns true si se renombró correctamente
   */
  async rename(oldKey: string, newKey: string): Promise<boolean> {
    try {
      await this.client.rename(oldKey, newKey);
      return true;
    } catch (error) {
      this.logError(`Redis RENAME error: ${error.message}`);
      return false;
    }
  }

  // ============================================
  // HASH OPERATIONS
  // ============================================

  /**
   * Obtiene un campo de un hash
   * @param key - Clave del hash
   * @param field - Campo
   * @returns Valor o null
   */
  async hGet(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      this.logError(`Redis HGET error: ${error.message}`);
      return null;
    }
  }

  /**
   * Establece un campo en un hash
   * @param key - Clave del hash
   * @param field - Campo
   * @param value - Valor
   * @returns true si es nuevo campo, false si actualizó
   */
  async hSet(key: string, field: string, value: string | number): Promise<boolean> {
    try {
      const result = await this.client.hset(key, field, value.toString());
      return result === 1;
    } catch (error) {
      this.logError(`Redis HSET error: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtiene todos los campos y valores de un hash
   * @param key - Clave del hash
   * @returns Objeto con campos y valores
   */
  async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      this.logError(`Redis HGETALL error: ${error.message}`);
      return {};
    }
  }

  /**
   * Establece múltiples campos en un hash
   * @param key - Clave del hash
   * @param data - Objeto con campos y valores
   * @returns true si se establecieron correctamente
   */
  async hMSet(key: string, data: Record<string, string | number>): Promise<boolean> {
    try {
      const entries = Object.entries(data);
      if (entries.length === 0) return true;
      const mapped: Record<string, string> = {};
      for (const [field, value] of entries) {
        mapped[field] = value.toString();
      }
      await this.client.hmset(key, mapped);
      return true;
    } catch (error) {
      this.logError(`Redis HMSET error: ${error.message}`);
      return false;
    }
  }

  /**
   * Elimina campos de un hash
   * @param key - Clave del hash
   * @param fields - Campos a eliminar
   * @returns Número de campos eliminados
   */
  async hDel(key: string, ...fields: string[]): Promise<number> {
    try {
      if (fields.length === 0) return 0;
      return await this.client.hdel(key, ...fields);
    } catch (error) {
      this.logError(`Redis HDEL error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Verifica si un campo existe en un hash
   * @param key - Clave del hash
   * @param field - Campo
   * @returns true si existe
   */
  async hExists(key: string, field: string): Promise<boolean> {
    try {
      const result = await this.client.hexists(key, field);
      return result === 1;
    } catch (error) {
      this.logError(`Redis HEXISTS error: ${error.message}`);
      return false;
    }
  }

  /**
   * Incrementa un campo numérico en un hash
   * @param key - Clave del hash
   * @param field - Campo
   * @param increment - Valor a incrementar
   * @returns Nuevo valor
   */
  async hIncr(key: string, field: string, increment: number = 1): Promise<number> {
    try {
      return await this.client.hincrby(key, field, increment);
    } catch (error) {
      this.logError(`Redis HINCRBY error: ${error.message}`);
      return 0;
    }
  }

  // ============================================
  // LIST OPERATIONS
  // ============================================

  /**
   * Agrega elementos al inicio de una lista
   * @param key - Clave de la lista
   * @param values - Valores a agregar
   * @returns Longitud de la lista después de agregar
   */
  async lPush(key: string, ...values: (string | number)[]): Promise<number> {
    try {
      if (values.length === 0) return 0;
      return await this.client.lpush(key, ...values.map(String));
    } catch (error) {
      this.logError(`Redis LPUSH error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Agrega elementos al final de una lista
   * @param key - Clave de la lista
   * @param values - Valores a agregar
   * @returns Longitud de la lista después de agregar
   */
  async rPush(key: string, ...values: (string | number)[]): Promise<number> {
    try {
      if (values.length === 0) return 0;
      return await this.client.rpush(key, ...values.map(String));
    } catch (error) {
      this.logError(`Redis RPUSH error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Obtiene y elimina el primer elemento de una lista
   * @param key - Clave de la lista
   * @returns Elemento o null
   */
  async lPop(key: string): Promise<string | null> {
    try {
      return await this.client.lpop(key);
    } catch (error) {
      this.logError(`Redis LPOP error: ${error.message}`);
      return null;
    }
  }

  /**
   * Obtiene y elimina el último elemento de una lista
   * @param key - Clave de la lista
   * @returns Elemento o null
   */
  async rPop(key: string): Promise<string | null> {
    try {
      return await this.client.rpop(key);
    } catch (error) {
      this.logError(`Redis RPOP error: ${error.message}`);
      return null;
    }
  }

  /**
   * Obtiene un rango de elementos de una lista
   * @param key - Clave de la lista
   * @param start - Índice inicial
   * @param stop - Índice final (-1 para el último)
   * @returns Array de elementos
   */
  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lrange(key, start, stop);
    } catch (error) {
      this.logError(`Redis LRANGE error: ${error.message}`);
      return [];
    }
  }

  /**
   * Obtiene la longitud de una lista
   * @param key - Clave de la lista
   * @returns Longitud
   */
  async lLen(key: string): Promise<number> {
    try {
      return await this.client.llen(key);
    } catch (error) {
      this.logError(`Redis LLEN error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Recorta una lista a un rango específico
   * @param key - Clave de la lista
   * @param start - Índice inicial
   * @param stop - Índice final
   * @returns true si se recortó correctamente
   */
  async lTrim(key: string, start: number, stop: number): Promise<boolean> {
    try {
      await this.client.ltrim(key, start, stop);
      return true;
    } catch (error) {
      this.logError(`Redis LTRIM error: ${error.message}`);
      return false;
    }
  }

  // ============================================
  // SET OPERATIONS
  // ============================================

  /**
   * Agrega elementos a un set
   * @param key - Clave del set
   * @param members - Miembros a agregar
   * @returns Número de miembros agregados (nuevos)
   */
  async sAdd(key: string, ...members: (string | number)[]): Promise<number> {
    try {
      if (members.length === 0) return 0;
      return await this.client.sadd(key, ...members.map(String));
    } catch (error) {
      this.logError(`Redis SADD error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Elimina elementos de un set
   * @param key - Clave del set
   * @param members - Miembros a eliminar
   * @returns Número de miembros eliminados
   */
  async sRem(key: string, ...members: (string | number)[]): Promise<number> {
    try {
      if (members.length === 0) return 0;
      return await this.client.srem(key, ...members.map(String));
    } catch (error) {
      this.logError(`Redis SREM error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Obtiene todos los miembros de un set
   * @param key - Clave del set
   * @returns Array de miembros
   */
  async sMembers(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      this.logError(`Redis SMEMBERS error: ${error.message}`);
      return [];
    }
  }

  /**
   * Verifica si un miembro existe en un set
   * @param key - Clave del set
   * @param member - Miembro a verificar
   * @returns true si existe
   */
  async sIsMember(key: string, member: string | number): Promise<boolean> {
    try {
      const result = await this.client.sismember(key, member.toString());
      return result === 1;
    } catch (error) {
      this.logError(`Redis SISMEMBER error: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtiene el número de miembros de un set
   * @param key - Clave del set
   * @returns Número de miembros
   */
  async sCard(key: string): Promise<number> {
    try {
      return await this.client.scard(key);
    } catch (error) {
      this.logError(`Redis SCARD error: ${error.message}`);
      return 0;
    }
  }

  // ============================================
  // SORTED SET OPERATIONS
  // ============================================

  /**
   * Agrega elementos a un sorted set
   * @param key - Clave del sorted set
   * @param scoreMembers - Array de [score, member]
   * @returns Número de miembros agregados
   */
  async zAdd(key: string, ...scoreMembers: [number, string][]): Promise<number> {
    try {
      if (scoreMembers.length === 0) return 0;
      const args: (string | number)[] = [];
      for (const [score, member] of scoreMembers) {
        args.push(score, member);
      }
      return await this.client.zadd(key, ...args);
    } catch (error) {
      this.logError(`Redis ZADD error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Obtiene elementos de un sorted set por rango de posición
   * @param key - Clave del sorted set
   * @param start - Posición inicial
   * @param stop - Posición final
   * @param withScores - Incluir scores
   * @returns Array de miembros (y scores si se solicitan)
   */
  async zRange(
    key: string,
    start: number,
    stop: number,
    withScores: boolean = false,
  ): Promise<string[]> {
    try {
      if (withScores) {
        return await this.client.zrange(key, start, stop, 'WITHSCORES');
      }
      return await this.client.zrange(key, start, stop);
    } catch (error) {
      this.logError(`Redis ZRANGE error: ${error.message}`);
      return [];
    }
  }

  /**
   * Obtiene el score de un miembro
   * @param key - Clave del sorted set
   * @param member - Miembro
   * @returns Score o null
   */
  async zScore(key: string, member: string): Promise<number | null> {
    try {
      const score = await this.client.zscore(key, member);
      return score !== null ? parseFloat(score) : null;
    } catch (error) {
      this.logError(`Redis ZSCORE error: ${error.message}`);
      return null;
    }
  }

  /**
   * Incrementa el score de un miembro
   * @param key - Clave del sorted set
   * @param member - Miembro
   * @param increment - Valor a incrementar
   * @returns Nuevo score
   */
  async zIncrBy(key: string, member: string, increment: number): Promise<number> {
    try {
      const result = await this.client.zincrby(key, increment, member);
      return parseFloat(result);
    } catch (error) {
      this.logError(`Redis ZINCRBY error: ${error.message}`);
      return 0;
    }
  }

  // ============================================
  // CACHE HELPERS
  // ============================================

  /**
   * Obtiene valor de cache o ejecuta función y cachea
   * @param key - Clave de cache
   * @param fn - Función que genera el valor
   * @param ttl - TTL en segundos
   * @returns Valor cacheado o generado
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    try {
      // Intentar obtener de cache
      const cached = await this.getJson<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Single-flight: si ya hay una petición en vuelo para esta key, esperar
      const inflight = this.inflightRequests.get(key);
      if (inflight) {
        return inflight as Promise<T>;
      }

      // Ejecutar función y cachear resultado (single-flight)
      const promise = fn()
        .then(async (value) => {
          await this.setJson(key, value, { ttl: ttl || this.defaultTTL });
          return value;
        })
        .finally(() => {
          this.inflightRequests.delete(key);
        });

      this.inflightRequests.set(key, promise);
      return promise;
    } catch (error) {
      this.logError(`Redis getOrSet error for key ${key}: ${error.message}`);
      return fn();
    }
  }

  /**
   * Invalida cache por patrón
   * @param pattern - Patrón de claves (ej: "user:*")
   * @returns Número de claves eliminadas
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.scan({ pattern });
      if (keys.length === 0) return 0;
      return await this.del(...keys);
    } catch (error) {
      this.logError(`Redis invalidatePattern error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Limpia todo el cache de la base de datos actual
   * @returns true si se limpió correctamente
   */
  async flushDb(): Promise<boolean> {
    try {
      await this.client.flushdb();
      this.logWarn('Redis database flushed');
      return true;
    } catch (error) {
      this.logError(`Redis FLUSHDB error: ${error.message}`);
      return false;
    }
  }

  // ============================================
  // LOCK / DISTRIBUTED LOCKING
  // ============================================

  /**
   * Adquiere un lock distribuido
   * @param lockKey - Clave del lock
   * @param ttl - TTL en segundos (default: 30)
   * @param lockValue - Valor único del lock (default: UUID)
   * @returns Valor del lock si se adquirió, null si no
   */
  async acquireLock(lockKey: string, ttl: number = 30, lockValue?: string): Promise<string | null> {
    try {
      const value = lockValue || `lock:${Date.now()}:${Math.random()}`;
      const acquired = await this.setNx(lockKey, value, ttl);
      return acquired ? value : null;
    } catch (error) {
      this.logError(`Redis acquireLock error: ${error.message}`);
      return null;
    }
  }

  /**
   * Libera un lock distribuido
   * @param lockKey - Clave del lock
   * @param lockValue - Valor del lock (para verificar ownership)
   * @returns true si se liberó correctamente
   */
  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    try {
      // Script Lua para liberar lock de forma atómica
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await this.client.eval(script, 1, lockKey, lockValue);
      return result === 1;
    } catch (error) {
      this.logError(`Redis releaseLock error: ${error.message}`);
      return false;
    }
  }

  /**
   * Extiende el TTL de un lock
   * @param lockKey - Clave del lock
   * @param lockValue - Valor del lock
   * @param ttl - Nuevo TTL en segundos
   * @returns true si se extendió correctamente
   */
  async extendLock(lockKey: string, lockValue: string, ttl: number): Promise<boolean> {
    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("expire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;
      const result = await this.client.eval(script, 1, lockKey, lockValue, ttl);
      return result === 1;
    } catch (error) {
      this.logError(`Redis extendLock error: ${error.message}`);
      return false;
    }
  }

  // ============================================
  // PUB/SUB
  // ============================================

  /**
   * Publica un mensaje en un canal
   * @param channel - Canal
   * @param message - Mensaje
   * @returns Número de suscriptores que recibieron el mensaje
   */
  async publish(channel: string, message: string | object): Promise<number> {
    try {
      const msg = typeof message === 'object' ? JSON.stringify(message) : message;
      return await this.client.publish(channel, msg);
    } catch (error) {
      this.logError(`Redis PUBLISH error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Suscribe a un canal con dispatcher único (sin listeners acumulativos)
   * @param channel - Canal
   * @param callback - Callback para mensajes
   */
  async subscribe(
    channel: string,
    callback: (message: string, channel: string) => void,
  ): Promise<void> {
    try {
      // Registrar único listener de 'message' la primera vez
      if (!this.messageListenerAttached) {
        this.subscriber.on('message', (ch: string, msg: string) => {
          const handlers = this.subscriptionHandlers.get(ch);
          if (handlers) {
            for (const handler of handlers) {
              try {
                handler(msg, ch);
              } catch (err) {
                this.logError(`Pub/Sub handler error on channel ${ch}: ${err.message}`);
              }
            }
          }
        });
        this.messageListenerAttached = true;
      }

      // Registrar callback en el dispatcher
      if (!this.subscriptionHandlers.has(channel)) {
        this.subscriptionHandlers.set(channel, new Set());
        await this.subscriber.subscribe(channel);
      }
      this.subscriptionHandlers.get(channel)!.add(callback);

      this.logger.log(`Subscribed to channel: ${channel}`);
    } catch (error) {
      this.logError(`Redis SUBSCRIBE error: ${error.message}`);
    }
  }

  /**
   * Cancela suscripción a un canal (limpia handlers)
   * @param channel - Canal
   * @param callback - Callback específico a remover (si no se pasa, remueve todos)
   */
  async unsubscribe(
    channel: string,
    callback?: (message: string, channel: string) => void,
  ): Promise<void> {
    try {
      const handlers = this.subscriptionHandlers.get(channel);
      if (handlers) {
        if (callback) {
          handlers.delete(callback);
        } else {
          handlers.clear();
        }

        // Si no quedan handlers, desuscribir del canal
        if (handlers.size === 0) {
          this.subscriptionHandlers.delete(channel);
          await this.subscriber.unsubscribe(channel);
        }
      } else {
        await this.subscriber.unsubscribe(channel);
      }

      this.logger.log(`Unsubscribed from channel: ${channel}`);
    } catch (error) {
      this.logError(`Redis UNSUBSCRIBE error: ${error.message}`);
    }
  }

  // ============================================
  // UTILITY
  // ============================================

  /**
   * Ejecuta un ping al servidor
   * @returns 'PONG' si está conectado
   */
  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (error) {
      this.logError(`Redis PING error: ${error.message}`);
      return 'ERROR';
    }
  }

  /**
   * Obtiene información del servidor Redis
   * @param section - Sección específica (opcional)
   * @returns Información del servidor
   */
  async info(section?: string): Promise<string> {
    try {
      if (section) {
        return await this.client.info(section);
      }
      return await this.client.info();
    } catch (error) {
      this.logError(`Redis INFO error: ${error.message}`);
      return '';
    }
  }

  /**
   * Obtiene el tamaño de la base de datos (número de claves)
   * @returns Número de claves
   */
  async dbSize(): Promise<number> {
    try {
      return await this.client.dbsize();
    } catch (error) {
      this.logError(`Redis DBSIZE error: ${error.message}`);
      return 0;
    }
  }

  // ============================================
  // KEY BUILDERS
  // ============================================

  /**
   * Construye una clave Redis con formato consistente
   * Usa ':' como separador estándar
   *
   * @param parts - Partes de la clave
   * @returns Clave formateada (ej: 'auth:user:123:full')
   *
   * @example
   * buildKey('auth', 'user', userId, 'full') // 'auth:user:123:full'
   * buildKey('session', schema, 'user', odId) // 'session:tenant1:user:456'
   */
  buildKey(...parts: (string | number | null | undefined)[]): string {
    return parts
      .filter((part) => part !== null && part !== undefined && part !== '')
      .map((part) => String(part))
      .join(':');
  }

  /**
   * Construye un patrón para búsqueda de claves
   * Útil para invalidar múltiples claves relacionadas
   *
   * @param parts - Partes del patrón (el último puede ser '*' para wildcard)
   * @returns Patrón de búsqueda (ej: 'auth:user:123:*')
   *
   * @example
   * buildPattern('auth', 'user', userId, '*') // 'auth:user:123:*'
   * buildPattern('session', '*') // 'session:*'
   */
  buildPattern(...parts: (string | number | null | undefined)[]): string {
    return this.buildKey(...parts);
  }

  private logWarn(message: string, details?: unknown): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.CACHE,
      service: RedisService.name,
      metadata: details ? { details: String(details) } : undefined,
    });
  }

  private logError(message: string, details?: unknown): void {
    const stack = details instanceof Error ? details.stack : undefined;
    this.logger.error(message, stack);
    void this.loggerService?.error(message, {
      context: LogContext.CACHE,
      service: RedisService.name,
      stack,
      metadata: details ? { details: String(details) } : undefined,
    });
  }
}


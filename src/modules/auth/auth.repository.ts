// src/modules/auth/auth.repository.ts

/**
 * @fileoverview Repository para sesiones de autenticación
 * @module modules/auth
 *
 * ⚠️ REGLAS:
 * - Extiende BaseRepository para infraestructura multi-tenant
 * - Usa createStaticQueryBuilder() para queries en schema public
 * - CONSISTENCIA: Todos los queries (SELECT/UPDATE/DELETE) usan alias
 * - SIEMPRE usar parámetros con :param syntax (previene SQL injection)
 * - NO usar query() con SQL raw
 * - NO tiene lógica de negocio
 *
 * 📋 ENTIDAD: sessions (schema public)
 * - Las sesiones están en schema public (compartidas entre tenants)
 * - Por tanto, usa createStaticQueryBuilder() sin withSchema()
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseRepository } from '@shared/database/base.repository';
import { SchemaContext } from '@shared/database/schema.context';

import { SessionEntity } from './entities';

/**
 * AuthRepository - Repository para gestión de sesiones
 *
 * Extiende BaseRepository para tener infraestructura multi-tenant lista,
 * pero usa createStaticQueryBuilder() porque sessions está en schema public.
 *
 * PATRÓN CONSISTENTE: Todos los queries usan alias 'session'
 *
 * @example
 * ```typescript
 * // Todos los queries usan alias para consistencia
 * const session = await this.authRepository.findById('session-id');
 * await this.authRepository.updateRefreshToken('id', 'token', date);
 * ```
 */
@Injectable()
export class AuthRepository extends BaseRepository<SessionEntity> {
  constructor(
    @InjectRepository(SessionEntity)
    repository: Repository<SessionEntity>,
    schemaContext: SchemaContext,
  ) {
    super(repository, schemaContext);
  }

  // ============================================
  // CREATE
  // ============================================

  /**
   * Crear nueva sesión
   */
  async createSession(data: Partial<SessionEntity>): Promise<SessionEntity> {
    const session = this.repository.create(data);
    return await this.repository.save(session);
  }

  // ============================================
  // READ
  // ============================================

  /**
   * Buscar sesión por ID
   */
  async findById(id: string): Promise<SessionEntity | null> {
    return await this.createStaticQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .where('session.id = :id', { id })
      .andWhere('session.deletedAt IS NULL')
      .getOne();
  }

  /**
   * Buscar sesión por refresh token
   */
  async findByRefreshToken(refreshToken: string): Promise<SessionEntity | null> {
    return await this.createStaticQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .where('session.refreshToken = :refreshToken', { refreshToken })
      .andWhere('session.deletedAt IS NULL')
      .getOne();
  }

  /**
   * Buscar sesiones activas de un usuario
   */
  async findActiveByUserId(userId: string): Promise<SessionEntity[]> {
    return await this.createStaticQueryBuilder('session')
      .where('session.userId = :userId', { userId })
      .andWhere('session.deletedAt IS NULL')
      .andWhere('session.isActive = :isActive', { isActive: true })
      .andWhere('session.isRevoked = :isRevoked', { isRevoked: false })
      .andWhere('session.expiresAt > :now', { now: new Date() })
      .orderBy('session.lastActivityAt', 'DESC')
      .getMany();
  }

  /**
   * Buscar todas las sesiones de un usuario (incluyendo inactivas)
   */
  async findAllByUserId(userId: string): Promise<SessionEntity[]> {
    return await this.createStaticQueryBuilder('session')
      .where('session.userId = :userId', { userId })
      .andWhere('session.deletedAt IS NULL')
      .orderBy('session.lastActivityAt', 'DESC')
      .getMany();
  }

  /**
   * Verificar si existe sesión válida para refresh token
   */
  async existsValidSession(refreshToken: string): Promise<boolean> {
    const count = await this.createStaticQueryBuilder('session')
      .where('session.refreshToken = :refreshToken', { refreshToken })
      .andWhere('session.deletedAt IS NULL')
      .andWhere('session.isActive = :isActive', { isActive: true })
      .andWhere('session.isRevoked = :isRevoked', { isRevoked: false })
      .andWhere('session.expiresAt > :now', { now: new Date() })
      .getCount();

    return count > 0;
  }

  // ============================================
  // UPDATE
  // ============================================

  /**
   * Actualizar refresh token (rotación)
   * CONSISTENCIA: Usa alias 'session' como los SELECT
   */
  async updateRefreshToken(
    sessionId: string,
    newRefreshToken: string,
    expiresAt: Date,
  ): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder('session')
      .update()
      .set({
        refreshToken: newRefreshToken,
        expiresAt,
        lastActivityAt: new Date(),
      })
      .where('session.id = :sessionId', { sessionId })
      .andWhere('session.deletedAt IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  /**
   * Actualizar última actividad
   * CONSISTENCIA: Usa alias 'session' como los SELECT
   */
  async updateLastActivity(sessionId: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder('session')
      .update()
      .set({ lastActivityAt: new Date() })
      .where('session.id = :sessionId', { sessionId })
      .andWhere('session.deletedAt IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  // ============================================
  // DELETE / REVOKE
  // ============================================

  /**
   * Revocar sesión específica
   * CONSISTENCIA: Usa alias 'session' como los SELECT
   */
  async revokeSession(sessionId: string, reason?: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder('session')
      .update()
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason || 'Revoked by user',
        isActive: false,
      })
      .where('session.id = :sessionId', { sessionId })
      .andWhere('session.deletedAt IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  /**
   * Revocar sesión por refresh token
   * CONSISTENCIA: Usa alias 'session' como los SELECT
   */
  async revokeByRefreshToken(refreshToken: string, reason?: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder('session')
      .update()
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason || 'Token revoked',
        isActive: false,
      })
      .where('session.refreshToken = :refreshToken', { refreshToken })
      .andWhere('session.deletedAt IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  /**
   * Revocar todas las sesiones de un usuario
   * CONSISTENCIA: Usa alias 'session' como los SELECT
   */
  async revokeAllByUserId(userId: string, reason?: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('session')
      .update()
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason || 'All sessions revoked',
        isActive: false,
      })
      .where('session.userId = :userId', { userId })
      .andWhere('session.deletedAt IS NULL')
      .andWhere('session.isRevoked = :isRevoked', { isRevoked: false })
      .execute();

    return result.affected ?? 0;
  }

  /**
   * Revocar todas las sesiones excepto la actual
   * CONSISTENCIA: Usa alias 'session' como los SELECT
   */
  async revokeOtherSessions(
    userId: string,
    currentSessionId: string,
    reason?: string,
  ): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('session')
      .update()
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason || 'Other sessions revoked',
        isActive: false,
      })
      .where('session.userId = :userId', { userId })
      .andWhere('session.id != :currentSessionId', { currentSessionId })
      .andWhere('session.deletedAt IS NULL')
      .andWhere('session.isRevoked = :isRevoked', { isRevoked: false })
      .execute();

    return result.affected ?? 0;
  }

  /**
   * Soft delete de sesión
   * CONSISTENCIA: Usa alias 'session' como los SELECT
   */
  async softDelete(sessionId: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder('session')
      .softDelete()
      .where('session.id = :sessionId', { sessionId })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  // ============================================
  // CLEANUP
  // ============================================

  /**
   * Eliminar sesiones expiradas
   * CONSISTENCIA: Usa alias 'session' como los SELECT
   */
  async deleteExpiredSessions(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder() // ✅ SIN alias
      .delete()
      .from(SessionEntity) // ✅ Especificar entidad explícitamente
      .where('expiresAt < :now', { now: new Date() }) // ✅ SIN alias
      .orWhere('deletedAt IS NOT NULL') // ✅ SIN alias
      .execute();

    return result.affected ?? 0;
  }

  /**
   * Contar sesiones activas por usuario
   */
  async countActiveByUserId(userId: string): Promise<number> {
    return await this.createStaticQueryBuilder('session')
      .where('session.userId = :userId', { userId })
      .andWhere('session.deletedAt IS NULL')
      .andWhere('session.isActive = :isActive', { isActive: true })
      .andWhere('session.isRevoked = :isRevoked', { isRevoked: false })
      .andWhere('session.expiresAt > :now', { now: new Date() })
      .getCount();
  }

  /**
   * Obtener estadísticas de sesiones
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    revoked: number;
  }> {
    const now = new Date();

    const [total, active, expired, revoked] = await Promise.all([
      // Total de sesiones no eliminadas
      this.createStaticQueryBuilder('session').where('session.deletedAt IS NULL').getCount(),

      // Sesiones activas
      this.createStaticQueryBuilder('session')
        .where('session.deletedAt IS NULL')
        .andWhere('session.isActive = :isActive', { isActive: true })
        .andWhere('session.isRevoked = :isRevoked', { isRevoked: false })
        .andWhere('session.expiresAt > :now', { now })
        .getCount(),

      // Sesiones expiradas
      this.createStaticQueryBuilder('session')
        .where('session.deletedAt IS NULL')
        .andWhere('session.expiresAt <= :now', { now })
        .getCount(),

      // Sesiones revocadas
      this.createStaticQueryBuilder('session')
        .where('session.deletedAt IS NULL')
        .andWhere('session.isRevoked = :isRevoked', { isRevoked: true })
        .getCount(),
    ]);

    return { total, active, expired, revoked };
  }
}

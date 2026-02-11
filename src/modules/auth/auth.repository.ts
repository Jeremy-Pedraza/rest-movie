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
 * PATRÓN CONSISTENTE: Todos los queries usan alias
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
      .andWhere('session.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Buscar sesión por refresh token
   */
  async findByRefreshToken(refreshToken: string): Promise<SessionEntity | null> {
    return await this.createStaticQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .where('session.refresh_token = :refresh_token', { refresh_token: refreshToken })
      .andWhere('session.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Buscar sesiones activas de un usuario
   */
  async findActiveByUserId(userId: string): Promise<SessionEntity[]> {
    return await this.createStaticQueryBuilder('session')
      .where('session.user_id = :user_id', { user_id: userId })
      .andWhere('session.deleted_at IS NULL')
      .andWhere('session.is_active = :is_active', { is_active: true })
      .andWhere('session.is_revoked = :is_revoked', { is_revoked: false })
      .andWhere('session.expires_at > :now', { now: new Date() })
      .orderBy('session.last_activity_at', 'DESC')
      .getMany();
  }

  /**
   * Buscar todas las sesiones de un usuario (incluyendo inactivas)
   */
  async findAllByUserId(userId: string): Promise<SessionEntity[]> {
    return await this.createStaticQueryBuilder('session')
      .where('session.user_id = :user_id', { user_id: userId })
      .andWhere('session.deleted_at IS NULL')
      .orderBy('session.last_activity_at', 'DESC')
      .getMany();
  }

  /**
   * Buscar sesión por token JTI (JWT ID)
   */
  async findByTokenJti(tokenJti: string): Promise<SessionEntity | null> {
    return await this.createStaticQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .where('session.token_jti = :token_jti', { token_jti: tokenJti })
      .andWhere('session.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Marcar sesión como consumida (token fue usado para rotar)
   */
  async consumeSession(sessionId: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .update()
      .set({
        consumed_at: new Date(),
        is_active: false,
      })
      .where('session.id = :session_id', { session_id: sessionId })
      .andWhere('session.deleted_at IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  /**
   * Revocar toda la familia de refresh tokens (detección de reuse)
   */
  async revokeByFamily(family: string, reason?: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update()
      .set({
        is_revoked: true,
        revoked_at: new Date(),
        revoked_reason: reason || 'Token reuse detected - family revoked',
        is_active: false,
      })
      .where('session.refresh_token_family = :family', { family })
      .andWhere('session.deleted_at IS NULL')
      .andWhere('session.is_revoked = :is_revoked', { is_revoked: false })
      .execute();

    return result.affected ?? 0;
  }

  /**
   * Verificar si existe sesión válida para refresh token
   */
  async existsValidSession(refreshToken: string): Promise<boolean> {
    const count = await this.createStaticQueryBuilder('session')
      .where('session.refresh_token = :refresh_token', { refresh_token: refreshToken })
      .andWhere('session.deleted_at IS NULL')
      .andWhere('session.is_active = :is_active', { is_active: true })
      .andWhere('session.is_revoked = :is_revoked', { is_revoked: false })
      .andWhere('session.expires_at > :now', { now: new Date() })
      .getCount();

    return count > 0;
  }

  // ============================================
  // UPDATE
  // ============================================

  /**
   * Actualizar refresh token (rotación)
   * CONSISTENCIA: Usa alias  como los SELECT
   */
  async updateRefreshToken(
    sessionId: string,
    newRefreshToken: string,
    expiresAt: Date,
  ): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .update()
      .set({
        refresh_token: newRefreshToken,
        expires_at: expiresAt,
        last_activity_at: new Date(),
      })
      .where('session.id = :session_id', { session_id: sessionId })
      .andWhere('session.deleted_at IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  /**
   * Actualizar última actividad
   * CONSISTENCIA: Usa alias  como los SELECT
   */
  async updateLastActivity(sessionId: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .update()
      .set({ last_activity_at: new Date() })
      .where('session.id = :session_id', { session_id: sessionId })
      .andWhere('session.deleted_at IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  // ============================================
  // DELETE / REVOKE
  // ============================================

  /**
   * Revocar sesión específica
   * CONSISTENCIA: Usa alias  como los SELECT
   */
  async revokeSession(sessionId: string, reason?: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .update()
      .set({
        is_revoked: true,
        revoked_at: new Date(),
        revoked_reason: reason || 'Revoked by user',
        is_active: false,
      })
      .where('session.id = :session_id', { session_id: sessionId })
      .andWhere('session.deleted_at IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  /**
   * Revocar sesión por refresh token
   * CONSISTENCIA: Usa alias  como los SELECT
   */
  async revokeByRefreshToken(refreshToken: string, reason?: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .update()
      .set({
        is_revoked: true,
        revoked_at: new Date(),
        revoked_reason: reason || 'Token revoked',
        is_active: false,
      })
      .where('session.refresh_token = :refresh_token', { refresh_token: refreshToken })
      .andWhere('session.deleted_at IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  /**
   * Revocar todas las sesiones de un usuario
   * CONSISTENCIA: Usa alias  como los SELECT
   */
  async revokeAllByUserId(userId: string, reason?: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update()
      .set({
        is_revoked: true,
        revoked_at: new Date(),
        revoked_reason: reason || 'All sessions revoked',
        is_active: false,
      })
      .where('session.user_id = :user_id', { user_id: userId })
      .andWhere('session.deleted_at IS NULL')
      .andWhere('session.is_revoked = :is_revoked', { is_revoked: false })
      .execute();

    return result.affected ?? 0;
  }

  /**
   * Revocar todas las sesiones excepto la actual
   * CONSISTENCIA: Usa alias  como los SELECT
   */
  async revokeOtherSessions(
    userId: string,
    currentSessionId: string,
    reason?: string,
  ): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update()
      .set({
        is_revoked: true,
        revoked_at: new Date(),
        revoked_reason: reason || 'Other sessions revoked',
        is_active: false,
      })
      .where('session.user_id = :user_id', { user_id: userId })
      .andWhere('session.id != :current_session_id', { current_session_id: currentSessionId })
      .andWhere('session.deleted_at IS NULL')
      .andWhere('session.is_revoked = :is_revoked', { is_revoked: false })
      .execute();

    return result.affected ?? 0;
  }

  /**
   * Soft delete de sesión
   * CONSISTENCIA: Usa alias  como los SELECT
   */
  async softDelete(sessionId: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .softDelete()
      .where('session.id = :session_id', { session_id: sessionId })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  // ============================================
  // CLEANUP
  // ============================================

  /**
   * Eliminar sesiones expiradas
   * CONSISTENCIA: Usa alias  como los SELECT
   */
  async deleteExpiredSessions(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder() // ✅ SIN alias
      .delete()
      .from(SessionEntity) // ✅ Especificar entidad explícitamente
      .where('expires_at < :now', { now: new Date() }) // ✅ SIN alias
      .orWhere('deleted_at IS NOT NULL') // ✅ SIN alias
      .execute();

    return result.affected ?? 0;
  }

  /**
   * Contar sesiones activas por usuario
   */
  async countActiveByUserId(userId: string): Promise<number> {
    return await this.createStaticQueryBuilder('session')
      .where('session.user_id = :user_id', { user_id: userId })
      .andWhere('session.deleted_at IS NULL')
      .andWhere('session.is_active = :is_active', { is_active: true })
      .andWhere('session.is_revoked = :is_revoked', { is_revoked: false })
      .andWhere('session.expires_at > :now', { now: new Date() })
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
      this.createStaticQueryBuilder('session').where('session.deleted_at IS NULL').getCount(),

      // Sesiones activas
      this.createStaticQueryBuilder('session')
        .where('session.deleted_at IS NULL')
        .andWhere('session.is_active = :is_active', { is_active: true })
        .andWhere('session.is_revoked = :is_revoked', { is_revoked: false })
        .andWhere('session.expires_at > :now', { now })
        .getCount(),

      // Sesiones expiradas
      this.createStaticQueryBuilder('session')
        .where('session.deleted_at IS NULL')
        .andWhere('session.expires_at <= :now', { now })
        .getCount(),

      // Sesiones revocadas
      this.createStaticQueryBuilder('session')
        .where('session.deleted_at IS NULL')
        .andWhere('session.is_revoked = :is_revoked', { is_revoked: true })
        .getCount(),
    ]);

    return { total, active, expired, revoked };
  }
}

// src/modules/auth/auth.repository.ts

/**
 * @fileoverview Repository para sesiones de autenticación
 * @module modules/auth
 *
 * ⚠️ REGLAS:
 * - SIEMPRE usar createQueryBuilder (previene SQL injection)
 * - Parámetros con :param syntax
 * - NO usar repo.query() con SQL raw
 * - NO tiene lógica de negocio
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SessionEntity } from './entities';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly repo: Repository<SessionEntity>,
  ) {}

  // ============================================
  // CREATE
  // ============================================

  /**
   * Crear nueva sesión
   */
  async createSession(data: Partial<SessionEntity>): Promise<SessionEntity> {
    const session = this.repo.create(data);
    return await this.repo.save(session);
  }

  // ============================================
  // READ
  // ============================================

  /**
   * Buscar sesión por ID
   */
  async findById(id: string): Promise<SessionEntity | null> {
    return await this.repo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .where('session.id = :id', { id })
      .andWhere('session.deletedAt IS NULL')
      .getOne();
  }

  /**
   * Buscar sesión por refresh token
   */
  async findByRefreshToken(refreshToken: string): Promise<SessionEntity | null> {
    return await this.repo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .where('session.refreshToken = :refreshToken', { refreshToken })
      .andWhere('session.deletedAt IS NULL')
      .getOne();
  }

  /**
   * Buscar sesiones activas de un usuario
   */
  async findActiveByUserId(userId: string): Promise<SessionEntity[]> {
    return await this.repo
      .createQueryBuilder('session')
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
    return await this.repo
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId })
      .andWhere('session.deletedAt IS NULL')
      .orderBy('session.lastActivityAt', 'DESC')
      .getMany();
  }

  /**
   * Verificar si existe sesión válida para refresh token
   */
  async existsValidSession(refreshToken: string): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('session')
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
   */
  async updateRefreshToken(
    sessionId: string,
    newRefreshToken: string,
    expiresAt: Date,
  ): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(SessionEntity)
      .set({
        refreshToken: newRefreshToken,
        expiresAt,
        lastActivityAt: new Date(),
      })
      .where('id = :sessionId', { sessionId })
      .andWhere('deletedAt IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  /**
   * Actualizar última actividad
   */
  async updateLastActivity(sessionId: string): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(SessionEntity)
      .set({ lastActivityAt: new Date() })
      .where('id = :sessionId', { sessionId })
      .andWhere('deletedAt IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  // ============================================
  // DELETE / REVOKE
  // ============================================

  /**
   * Revocar sesión específica
   */
  async revokeSession(sessionId: string, reason?: string): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(SessionEntity)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason || 'Revoked by user',
        isActive: false,
      })
      .where('id = :sessionId', { sessionId })
      .andWhere('deletedAt IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  /**
   * Revocar sesión por refresh token
   */
  async revokeByRefreshToken(refreshToken: string, reason?: string): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(SessionEntity)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason || 'Token revoked',
        isActive: false,
      })
      .where('refreshToken = :refreshToken', { refreshToken })
      .andWhere('deletedAt IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  /**
   * Revocar todas las sesiones de un usuario
   */
  async revokeAllByUserId(userId: string, reason?: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(SessionEntity)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason || 'All sessions revoked',
        isActive: false,
      })
      .where('userId = :userId', { userId })
      .andWhere('deletedAt IS NULL')
      .andWhere('isRevoked = :isRevoked', { isRevoked: false })
      .execute();

    return result.affected ?? 0;
  }

  /**
   * Revocar todas las sesiones excepto la actual
   */
  async revokeOtherSessions(
    userId: string,
    currentSessionId: string,
    reason?: string,
  ): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(SessionEntity)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason || 'Other sessions revoked',
        isActive: false,
      })
      .where('userId = :userId', { userId })
      .andWhere('id != :currentSessionId', { currentSessionId })
      .andWhere('deletedAt IS NULL')
      .andWhere('isRevoked = :isRevoked', { isRevoked: false })
      .execute();

    return result.affected ?? 0;
  }

  /**
   * Soft delete de sesión
   */
  async softDelete(sessionId: string): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .softDelete()
      .where('id = :sessionId', { sessionId })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  // ============================================
  // CLEANUP
  // ============================================

  /**
   * Eliminar sesiones expiradas
   */
  async deleteExpiredSessions(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .from(SessionEntity)
      .where('expiresAt < :now', { now: new Date() })
      .orWhere('deletedAt IS NOT NULL')
      .execute();

    return result.affected ?? 0;
  }

  /**
   * Contar sesiones activas por usuario
   */
  async countActiveByUserId(userId: string): Promise<number> {
    return await this.repo
      .createQueryBuilder('session')
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
      this.repo.createQueryBuilder('session').where('session.deletedAt IS NULL').getCount(),

      // Sesiones activas
      this.repo
        .createQueryBuilder('session')
        .where('session.deletedAt IS NULL')
        .andWhere('session.isActive = :isActive', { isActive: true })
        .andWhere('session.isRevoked = :isRevoked', { isRevoked: false })
        .andWhere('session.expiresAt > :now', { now })
        .getCount(),

      // Sesiones expiradas
      this.repo
        .createQueryBuilder('session')
        .where('session.deletedAt IS NULL')
        .andWhere('session.expiresAt <= :now', { now })
        .getCount(),

      // Sesiones revocadas
      this.repo
        .createQueryBuilder('session')
        .where('session.deletedAt IS NULL')
        .andWhere('session.isRevoked = :isRevoked', { isRevoked: true })
        .getCount(),
    ]);

    return { total, active, expired, revoked };
  }
}

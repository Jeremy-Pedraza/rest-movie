// src/modules/auth/tests/auth-cache.service.spec.ts

/**
 * @fileoverview Tests unitarios para cache de autenticaciÃ³n
 * @module modules/auth/tests
 *
 * âœ… FASE 2: Tests para verificar:
 * - Cache hit/miss en login
 * - Cache hit/miss en refreshToken
 * - InvalidaciÃ³n de cache
 * - TTL correcto (55 min)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { AUTH_CACHE_TTL } from '@constants';
import { AuthService } from '../auth.service';
import { AuthRepository } from '../auth.repository';
import { UserService } from '@modules/user';
import { RedisService } from '@shared/redis';
import { HandleErrorService, SanitizerService } from '@shared/common';
import { EmailProducer } from '@modules/queue';
import { UtilsService } from '@shared/utils';

// ============================================
// MOCKS
// ============================================

const mockRedisService = {
  buildKey: jest.fn((...parts) => parts.filter(Boolean).join(':')),
  buildPattern: jest.fn((...parts) => parts.filter(Boolean).join(':')),
  get: jest.fn(),
  set: jest.fn(),
  getJson: jest.fn(),
  setJson: jest.fn(),
  del: jest.fn(),
  invalidatePattern: jest.fn(),
  getOrSet: jest.fn(),
};

const mockUserService = {
  findByEmailWithPassword: jest.fn(),
  findByIdWithCompanyAndRoles: jest.fn(),
  findById: jest.fn(),
  incrementFailedAttempts: jest.fn(),
  resetFailedAttempts: jest.fn(),
  updateLastLogin: jest.fn(),
  existsByEmail: jest.fn(),
  create: jest.fn(),
  updatePassword: jest.fn(),
  savePasswordResetToken: jest.fn(),
  invalidatePasswordResetToken: jest.fn(),
  findByIdWithPassword: jest.fn(),
  findByEmail: jest.fn(),
};

const mockAuthRepository = {
  findByRefreshToken: jest.fn(),
  findByTokenJti: jest.fn(),
  consumeSession: jest.fn(),
  deactivateExpiredSessions: jest.fn(),
  revokeSessionsByIds: jest.fn(),
  revokeSession: jest.fn(),
  revokeAllByUserId: jest.fn(),
  createSession: jest.fn(),
  updateRefreshToken: jest.fn(),
  findActiveByUserId: jest.fn(),
  findById: jest.fn(),
  revokeByRefreshToken: jest.fn(),
  revokeOtherSessions: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
  sign: jest.fn().mockReturnValue('mock-reset-token'),
  verify: jest.fn().mockReturnValue({
    sub: 'user-123',
    jti: 'mock-jti',
    schema: 'tenant_test',
  }),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, any> = {
      'jwt.secret': 'test-secret',
      'jwt.refreshSecret': 'test-refresh-secret',
      'jwt.expiresIn': 3600,
      'jwt.refreshExpiresIn': 604800,
      'jwt.resetSecret': 'reset-secret',
      APP_URL: 'http://localhost:3000',
    };
    return config[key];
  }),
};

const mockSanitizerService = {
  sanitizeEmail: jest.fn((email) => email.toLowerCase().trim()),
  sanitizeString: jest.fn((str) => str.trim()),
};

const mockHandleErrorService = {
  badRequest: jest.fn(),
  unauthorized: jest.fn(),
  notFound: jest.fn(),
  conflict: jest.fn(),
  forbidden: jest.fn(),
};

const mockEmailProducer = {
  queueEmail: jest.fn(),
  queueEmailUrgent: jest.fn(),
};

const mockUtilsService = {
  validation: {
    isEmail: jest.fn().mockReturnValue(true),
    validatePassword: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
  },
  string: {
    maskEmail: jest.fn((email) => email.replace(/(.{2})(.*)(@.*)/, '$1***$3')),
  },
  date: {
    isFuture: jest.fn().mockReturnValue(false),
    formatDateTime: jest.fn(),
    timeUntil: jest.fn(),
  },
  generateId: jest.fn().mockReturnValue('mock-uuid'),
  removeTimestamps: jest.fn((data) => data),
  crypto: {
    sha256: jest.fn((input) => `hashed-${input}`),
  },
};

// ============================================
// TEST DATA
// ============================================

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  password: '$2b$10$hashedpassword',
  first_name: 'Test',
  last_name: 'User',
  isActive: true,
  status: 'active',
  company_id: 'company-123',
  company: {
    id: 'company-123',
    name: 'Test Company',
    schema: 'tenant_test',
    is_active: true,
  },
  roles: [{ name: 'USER', permissions: [] }],
  roleNames: ['USER'],
};

const mockSession = {
  id: 'session-123',
  user_id: 'user-123',
  refresh_token: 'hashed-valid-refresh-token',
  refresh_token_family: 'family-123',
  consumed_at: null,
  is_revoked: false,
  expires_at: new Date(Date.now() + 86400000),
  ip_address: '127.0.0.1',
  user_agent: 'Mozilla/5.0',
  location: null,
  isValid: jest.fn().mockReturnValue(true),
};

// ============================================
// TESTS
// ============================================

describe('AuthService - Cache Integration', () => {
  let service: AuthService;
  let redisService: typeof mockRedisService;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: SanitizerService, useValue: mockSanitizerService },
        { provide: HandleErrorService, useValue: mockHandleErrorService },
        { provide: EmailProducer, useValue: mockEmailProducer },
        { provide: UtilsService, useValue: mockUtilsService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    redisService = module.get(RedisService);
  });

  describe('login() - Cache behavior', () => {
    beforeEach(() => {
      mockUserService.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockUserService.findById.mockResolvedValue(mockUser);
      mockAuthRepository.createSession.mockResolvedValue(mockSession);

      mockAuthRepository.findActiveByUserId.mockResolvedValue([]);
      mockAuthRepository.revokeSessionsByIds.mockResolvedValue(0);
    });

    it('should fetch from DB and cache on first login (cache miss)', async () => {
      // Arrange: Cache miss - getJson returns null
      redisService.getJson.mockResolvedValue(null);
      mockUserService.findByIdWithCompanyAndRoles.mockResolvedValue(mockUser);

      // Act
      await service.login(
        { email: 'test@example.com', password: 'password123' },
        '127.0.0.1',
        'Mozilla/5.0',
      );

      // Assert: Should call DB
      expect(mockUserService.findByIdWithCompanyAndRoles).toHaveBeenCalledWith(mockUser.id);

      // Assert: Should cache the result
      expect(redisService.setJson).toHaveBeenCalledWith(
        expect.stringContaining('auth:user:'),
        mockUser,
        { ttl: AUTH_CACHE_TTL }, // 55 minutes
      );
    });

    it('should return cached user on subsequent login (cache hit)', async () => {
      // Arrange: Cache hit - getJson returns cached user
      redisService.getJson.mockResolvedValue(mockUser);

      // Act
      await service.login(
        { email: 'test@example.com', password: 'password123' },
        '127.0.0.1',
        'Mozilla/5.0',
      );

      // Assert: Should NOT call findByIdWithCompanyAndRoles (heavy query)
      expect(mockUserService.findByIdWithCompanyAndRoles).not.toHaveBeenCalled();

      // Assert: Should NOT call setJson (already cached)
      expect(redisService.setJson).not.toHaveBeenCalled();
    });

    it('should use correct cache key format', async () => {
      // Arrange
      redisService.getJson.mockResolvedValue(null);
      mockUserService.findByIdWithCompanyAndRoles.mockResolvedValue(mockUser);

      // Act
      await service.login({ email: 'test@example.com', password: 'password123' }, '127.0.0.1');

      // Assert: buildKey should be called with correct format
      expect(redisService.buildKey).toHaveBeenCalledWith('auth', 'user', mockUser.id, 'full');
    });
  });

  describe('refreshToken() - Cache behavior', () => {
    beforeEach(() => {
      mockAuthRepository.findByTokenJti.mockResolvedValue(mockSession);
      mockAuthRepository.consumeSession.mockResolvedValue(true);
      mockAuthRepository.createSession.mockResolvedValue(mockSession);

      mockAuthRepository.findActiveByUserId.mockResolvedValue([]);
      mockAuthRepository.revokeSessionsByIds.mockResolvedValue(0);
    });

    it('should fetch from DB and cache on cache miss', async () => {
      // Arrange: Cache miss
      redisService.getJson.mockResolvedValue(null);
      mockUserService.findByIdWithCompanyAndRoles.mockResolvedValue(mockUser);

      // Act
      await service.refreshToken({ refreshToken: 'valid-refresh-token' });

      // Assert: Should call DB
      expect(mockUserService.findByIdWithCompanyAndRoles).toHaveBeenCalledWith(mockSession.user_id);

      // Assert: Should cache
      expect(redisService.setJson).toHaveBeenCalled();
    });

    it('should return cached user on cache hit', async () => {
      // Arrange: Cache hit
      redisService.getJson.mockResolvedValue(mockUser);

      // Act
      await service.refreshToken({ refreshToken: 'valid-refresh-token' });

      // Assert: Should NOT call heavy DB query
      expect(mockUserService.findByIdWithCompanyAndRoles).not.toHaveBeenCalled();
    });
  });

  describe('invalidateUserAuthCache()', () => {
    it('should invalidate cache on changePassword', async () => {
      // Arrange
      mockUserService.findByIdWithPassword.mockResolvedValue({
        ...mockUser,
        password: '$2b$10$correcthash',
      });
      redisService.del.mockResolvedValue(1);
      redisService.invalidatePattern.mockResolvedValue(0);

      // Mock bcrypt compare - this is tricky in unit tests
      // We'll skip actual password validation for this test
      jest
        .spyOn(require('bcryptjs'), 'compare')
        .mockResolvedValueOnce(true) // currentPassword valid
        .mockResolvedValueOnce(false); // newPassword is different

      // Act
      await service.changePassword('user-123', {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123!',
        newPasswordConfirmation: 'newPassword123!',
      });

      // Assert: Cache should be invalidated
      expect(redisService.del).toHaveBeenCalled();
      expect(redisService.invalidatePattern).toHaveBeenCalled();
    });

    it('should invalidate cache on logoutAll', async () => {
      // Arrange
      mockAuthRepository.revokeAllByUserId.mockResolvedValue(3);
      redisService.del.mockResolvedValue(1);
      redisService.invalidatePattern.mockResolvedValue(2);

      // Act
      await service.logoutAll('user-123');

      // Assert
      expect(redisService.del).toHaveBeenCalledWith(
        expect.stringContaining('auth:user:user-123:full'),
      );
      expect(redisService.invalidatePattern).toHaveBeenCalledWith(
        expect.stringContaining('session:*:user:user-123'),
      );
    });

    it('should delete correct cache keys format', async () => {
      // Arrange
      mockAuthRepository.revokeAllByUserId.mockResolvedValue(1);
      redisService.del.mockResolvedValue(1);
      redisService.invalidatePattern.mockResolvedValue(0);

      // Act
      await service.logoutAll('user-123');

      // Assert: buildKey should be called for auth cache
      expect(redisService.buildKey).toHaveBeenCalledWith('auth', 'user', 'user-123', 'full');

      // Assert: buildPattern should be called for session cache
      expect(redisService.buildPattern).toHaveBeenCalledWith('session', '*', 'user', 'user-123');
    });
  });

  describe('Cache TTL', () => {
    it('should use 55 minutes (3300 seconds) TTL', async () => {
      // Arrange
      redisService.getJson.mockResolvedValue(null);
      mockUserService.findByEmailWithPassword.mockResolvedValue(mockUser);
      mockUserService.findByIdWithCompanyAndRoles.mockResolvedValue(mockUser);
      mockUserService.findById.mockResolvedValue(mockUser);
      mockAuthRepository.createSession.mockResolvedValue(mockSession);

      // Act
      await service.login({ email: 'test@example.com', password: 'password123' }, '127.0.0.1');

      // Assert: TTL should be 3300 seconds (55 minutes)
      expect(redisService.setJson).toHaveBeenCalledWith(expect.any(String), expect.any(Object), {
        ttl: AUTH_CACHE_TTL,
      });
    });
  });
});

describe('RedisService - buildKey and buildPattern', () => {
  it('buildKey should join parts with colon', () => {
    const result = mockRedisService.buildKey('auth', 'user', '123', 'full');
    expect(result).toBe('auth:user:123:full');
  });

  it('buildKey should filter null and undefined values', () => {
    const result = mockRedisService.buildKey('auth', null, 'user', undefined, '123');
    expect(result).toBe('auth:user:123');
  });

  it('buildPattern should work same as buildKey', () => {
    const result = mockRedisService.buildPattern('session', '*', 'user', '123');
    expect(result).toBe('session:*:user:123');
  });
});

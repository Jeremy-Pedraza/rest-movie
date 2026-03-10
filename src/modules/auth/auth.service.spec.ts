import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { UserService } from '@modules/user/user.service';
import { HandleErrorService } from '@shared/common';

describe('AuthService', () => {
  let service: AuthService;
  let userService: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    toResponse: jest.Mock;
  };
  let jwtService: {
    sign: jest.Mock;
    verify: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };
  let handleError: {
    conflict: jest.Mock;
    handle: jest.Mock;
    unauthorized: jest.Mock;
    notFound: jest.Mock;
  };

  beforeEach(async () => {
    userService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      toResponse: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          'jwt.refreshSecret': 'refresh-secret-value-with-32-chars',
          'jwt.refreshExpiresIn': '7d',
          'jwt.expiresIn': '15m',
          'jwt.issuer': 'issuer',
          'jwt.audience': 'audience',
        };

        return values[key];
      }),
    };

    handleError = {
      conflict: jest.fn(),
      handle: jest.fn((error) => {
        throw error;
      }),
      unauthorized: jest.fn(),
      notFound: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: HandleErrorService, useValue: handleError },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('registers public users without forwarding roleIds', async () => {
    const createdUser = { id: 'user-1', email: 'user@example.com' } as never;
    userService.findByEmail.mockResolvedValue(null);
    userService.create.mockResolvedValue(createdUser);
    userService.toResponse.mockReturnValue({
      id: 'user-1',
      firstName: 'Test',
      lastName: 'User',
      email: 'user@example.com',
      isActive: true,
      roles: [{ id: 'role-public', name: 'publico' }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.register({
      firstName: 'Test',
      lastName: 'User',
      email: 'user@example.com',
      password: 'Password123!',
    });

    expect(userService.create).toHaveBeenCalledWith({
      firstName: 'Test',
      lastName: 'User',
      email: 'user@example.com',
      password: 'Password123!',
    });
  });

  it('verifies issuer and audience when refreshing tokens', async () => {
    jwtService.verify.mockReturnValue({
      sub: 'user-1',
      email: 'user@example.com',
      roles: ['publico'],
    });

    const createdUser = {
      id: 'user-1',
      email: 'user@example.com',
      isActive: true,
    } as never;
    userService.findById.mockResolvedValue(createdUser);
    userService.toResponse.mockReturnValue({
      id: 'user-1',
      firstName: 'Test',
      lastName: 'User',
      email: 'user@example.com',
      isActive: true,
      roles: [{ id: 'role-public', name: 'publico' }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.refreshToken({ refreshToken: 'refresh-token' });

    expect(jwtService.verify).toHaveBeenCalledWith('refresh-token', {
      secret: 'refresh-secret-value-with-32-chars',
      issuer: 'issuer',
      audience: 'audience',
    });
  });
});

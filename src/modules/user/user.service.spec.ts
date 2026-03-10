import {
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { UserService } from './user.service';
import { ROLES } from '@constants/roles.constant';

describe('UserService', () => {
  const userRepository = {
    create: jest.fn(),
  };

  const roleService = {
    findByIds: jest.fn(),
    findByName: jest.fn(),
  };

  const sanitizer = {
    sanitizeString: jest.fn((value: string) => value),
    sanitizeEmail: jest.fn((value: string) => value.toLowerCase()),
  };

  const handleError = {
    badRequest: jest.fn((message: string) => {
      throw new BadRequestException(message);
    }),
    forbidden: jest.fn((message: string) => {
      throw new ForbiddenException(message);
    }),
    internal: jest.fn((message: string) => {
      throw new InternalServerErrorException(message);
    }),
    handle: jest.fn((error: unknown) => {
      throw error;
    }),
  };

  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService(
      userRepository as never,
      roleService as never,
      sanitizer as never,
      handleError as never,
    );
  });

  it('rejects missing roles referenced by id', async () => {
    roleService.findByIds.mockResolvedValue([{ id: 'role-public', name: ROLES.PUBLICO }]);

    await expect(
      service.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'user@example.com',
        password: 'Password123!',
        roleIds: ['role-public', 'role-missing'],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects privileged roles in public flows', async () => {
    roleService.findByIds.mockResolvedValue([{ id: 'role-admin', name: ROLES.ADMINISTRADOR }]);

    await expect(
      service.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'user@example.com',
        password: 'Password123!',
        roleIds: ['role-admin'],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('assigns the public role when no roleIds are provided', async () => {
    roleService.findByName.mockResolvedValue({ id: 'role-public', name: ROLES.PUBLICO });
    userRepository.create.mockResolvedValue({
      id: 'user-1',
      roles: [{ id: 'role-public', name: ROLES.PUBLICO }],
    });

    await service.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'USER@example.com',
      password: 'Password123!',
    });

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        roles: [{ id: 'role-public', name: ROLES.PUBLICO }],
      }),
    );
  });

  it('fails fast when the public role is missing', async () => {
    roleService.findByName.mockResolvedValue(null);

    await expect(
      service.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'user@example.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

import { LoggerService } from './logger.service';
import { LogContext, LogLevel } from './entities/log.entity';

describe('LoggerService', () => {
  const repository = {
    createBatch: jest.fn().mockResolvedValue([]),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByRequestId: jest.fn(),
    findByUserId: jest.fn(),
    findRecentErrors: jest.fn(),
    getStats: jest.fn(),
    getCountByLevel: jest.fn(),
    getAverageResponseTime: jest.fn(),
    count: jest.fn(),
    deleteOldLogs: jest.fn(),
    deleteByLevel: jest.fn(),
  };

  const configService = {
    get: jest.fn().mockReturnValue('all'),
  };

  const handleError = {
    notFound: jest.fn(),
  };

  let service: LoggerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LoggerService(repository as never, configService as never, handleError as never);
  });

  afterEach(async () => {
    await service.stopAutoFlush();
  });

  it('redacts sensitive values before persisting logs', async () => {
    await service.log(LogLevel.INFO, 'password=secret token=abc', {
      context: LogContext.AUTH,
      metadata: {
        password: 'secret',
        nestedToken: 'abc',
        description: 'Bearer foo.bar.baz',
      },
      ip: '192.168.1.25',
      url: '/auth/refresh?refreshToken=abc123',
    });

    await service.flush();

    expect(repository.createBatch).toHaveBeenCalledWith([
      expect.objectContaining({
        message: 'password=[REDACTED] token=[REDACTED]',
        metadata: {
          password: '[REDACTED]',
          nestedToken: '[REDACTED]',
          description: 'Bearer [REDACTED]',
        },
        ip: '192.168.1.0',
        url: '/auth/refresh?refreshToken=[REDACTED]',
      }),
    ]);
  });
});

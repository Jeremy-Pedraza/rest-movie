import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const values: Record<string, string> = {
                'app.name': 'rest-backend-test',
                'app.nodeEnv': 'test',
              };
              return values[key];
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the wrapped status payload', () => {
      const result = appController.getStatus();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          name: 'rest-backend-test',
          environment: 'test',
        }),
      );
    });
  });
});

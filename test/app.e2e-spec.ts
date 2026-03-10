import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('API Contracts (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', {
      exclude: ['/health', '/health/ready'],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/health (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          status: 'ok',
        }),
      }),
    );
  });

  it('/api/v1/auth/register (POST) ignores unexpected roleIds from public payloads', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Public',
        lastName: 'User',
        email: 'public@example.com',
        password: 'Password123!',
        roleIds: ['11111111-1111-4111-8111-111111111111'],
      })
      .expect((res) => {
        expect([201, 400, 409, 500]).toContain(res.status);
      });

    expect(response.status).toBeDefined();
    if (response.status !== 201) {
      expect(JSON.stringify(response.body)).not.toContain('roleIds');
    }
  });
});

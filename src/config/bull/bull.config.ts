import { registerAs } from '@nestjs/config';
import { BullModuleOptions } from '@nestjs/bull';

export default registerAs(
  'bull',
  (): BullModuleOptions => ({
    redis: {
      host: process.env.BULL_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.BULL_REDIS_PORT || process.env.REDIS_PORT, 10) || 6379,
      password: process.env.BULL_REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.BULL_REDIS_DB || '0', 10),
    },
    defaultJobOptions: {
      // Bull 4.x soporta KeepJobsOptions { age, count } en runtime,
      // pero los tipos de @nestjs/bull no lo exponen correctamente
      removeOnComplete: { age: 3600, count: 200 } as any, // Max 200 completados, expiran en 1h
      removeOnFail: { age: 604800, count: 1000 } as any, // Max 1000 fallidos, expiran en 7 dias
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  }),
);

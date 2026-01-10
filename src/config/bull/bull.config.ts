import { registerAs } from '@nestjs/config';
import { BullModuleOptions } from '@nestjs/bull';

export default registerAs(
  'bull',
  (): BullModuleOptions => ({
    redis: {
      host: process.env.BULL_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.BULL_REDIS_PORT || process.env.REDIS_PORT, 10) || 6379,
      password: process.env.BULL_REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined,
    },
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  }),
);

import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

export const redisCacheAsyncConfig: CacheModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  isGlobal: true,
  useFactory: async (configService: ConfigService) => ({
    store: await redisStore({
      socket: {
        host: configService.get<string>('redis.host') || 'localhost',
        port: configService.get<number>('redis.port') || 6379,
      },
      password: configService.get<string>('redis.password') || undefined,
      database: configService.get<number>('redis.db') || 0,
      ttl: (configService.get<number>('redis.ttl') || 3600) * 1000,
    }),
  }),
};

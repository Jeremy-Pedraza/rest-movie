// src/shared/router/router.module.ts

/**
 * @fileoverview Módulo de Router HTTP
 * @module shared/router
 */

import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { HttpClientService } from './api/http-client.service';
import { ApiService } from './api/api.service';
import { RouterService } from './router.service';

@Global()
@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('app.httpTimeout') || 30000,
        maxRedirects: 5,
        headers: {
          'User-Agent': `RestBackend/${configService.get<string>('app.version') || '1.0.0'}`,
        },
      }),
    }),
  ],
  providers: [HttpClientService, ApiService, RouterService],
  exports: [HttpClientService, ApiService, RouterService],
})
export class RouterModule {}

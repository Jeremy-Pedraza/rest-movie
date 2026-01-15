import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getStatus() {
    return {
      success: true,
      message: 'Rest Backend API is running',
      data: {
        name: this.configService.get<string>('app.name'),
        version: '1.0.0',
        environment: this.configService.get<string>('app.nodeEnv'),
        timestamp: new Date().toISOString(),
      },
    };
  }

  healthCheck() {
    return {
      success: true,
      message: 'Health check passed',
      data: {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        },
      },
    };
  }
}

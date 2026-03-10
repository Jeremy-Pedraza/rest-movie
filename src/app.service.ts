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
}

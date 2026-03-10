import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { setupSwagger } from '@config/swagger';
import { winstonConfig } from '@config/winston';
import { helmetConfig, getCorsOptions } from '@config/security';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = configService.get<number>('app.port') || 3000;
  const host = configService.get<string>('app.host') || '0.0.0.0';
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';

  // Global prefix
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['/docs', '/docs-json', '/health', '/health/ready'],
  });

  // Trust proxy
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);

  // Security
  app.use(helmet(helmetConfig));

  // CORS
  const corsOptions = getCorsOptions(configService);
  app.enableCors(corsOptions);

  // Compression
  app.use(compression());

  // Global validation pipe
  const isProduction = nodeEnv === 'production';
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
      disableErrorMessages: isProduction,
    }),
  );

  // Swagger documentation
  if (nodeEnv !== 'production') {
    setupSwagger(app);
    logger.log(`Swagger documentation available at: http://${host}:${port}/docs`);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  // Start server
  await app.listen(port, host);

  logger.log(`Application is running on: http://${host}:${port}/${apiPrefix}`);
  logger.log(`Environment: ${nodeEnv}`);
}

bootstrap().catch((error) => {
  const fallbackLogger = new Logger('Bootstrap');
  try {
    fallbackLogger.error(`Fatal error during bootstrap: ${error?.message || error}`, error?.stack);
  } catch {
    console.error('Fatal error during bootstrap:', error);
  }
  process.exit(1);
});

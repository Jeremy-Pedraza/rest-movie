import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { setupSwagger } from '@config/swagger';
import { winstonConfig } from '@config/winston';
import { helmetConfig, getCorsOptionsWithSecurity, SecurityConfigService } from '@config/security';

async function bootstrap() {
  // Create app with Winston logger
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  const configService = app.get(ConfigService);
  const securityConfig = app.get(SecurityConfigService); // ✅ NUEVO
  const logger = new Logger('Bootstrap');

  // Get config values
  const port = configService.get<number>('app.port') || 3000;
  const host = configService.get<string>('app.host') || 'localhost';
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Security
  app.use(helmet(helmetConfig));

  // ✅ CORS con SecurityConfigService (sistema de whitelist multi-tenant)
  const corsOptions = getCorsOptionsWithSecurity(securityConfig, configService);
  app.enableCors(corsOptions);

  logger.log(
    `✅ CORS configurado con ${securityConfig.getAllowedDomains().length} dominios permitidos`,
  );

  // Compression
  app.use(compression());

  // Cookie parser
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Swagger documentation
  if (nodeEnv !== 'production') {
    setupSwagger(app);
    logger.log(`📚 Swagger documentation available at: http://${host}:${port}/docs`);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  // Start server
  await app.listen(port, host);

  logger.log(`🚀 Application is running on: http://${host}:${port}/${apiPrefix}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🔒 Security: ${securityConfig.getAllowedSchemas().length} schemas permitidos`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});

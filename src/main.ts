import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
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
  // Default '0.0.0.0' permite acceso desde fuera del contenedor/orquestador.
  // En desarrollo local, configurar APP_HOST=localhost en .env si se desea restringir.
  const host = configService.get<string>('app.host') || '0.0.0.0';
  // API Versioning
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';

  // Global prefix
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['/docs', '/docs-json', '/health', '/health/ready'],
  });

  // Security
  app.use(helmet(helmetConfig));

  // ✅ CORS con SecurityConfigService (sistema de whitelist multi-tenant)
  // NOTA: CORS opera a nivel HTTP (preflight OPTIONS + headers de respuesta).
  // DomainValidationMiddleware (app.module.ts) complementa validando requests
  // reales y cubriendo el header Referer. Ambas capas usan SecurityConfigService
  // como fuente única de verdad para dominios permitidos.
  const corsOptions = getCorsOptionsWithSecurity(securityConfig, configService);
  app.enableCors(corsOptions);

  // Compression
  app.use(compression());

  // Cookie parser
  app.use(cookieParser());

  // Global validation pipe
  // NOTA: enableImplicitConversion es necesario para que @Query() convierta
  // strings a number/boolean automáticamente. Asegurar que los DTOs tengan
  // decoradores explícitos (@IsInt, @IsBoolean, etc.) para validar tipos.
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
      // En producción, ocultar detalles de errores de validación al cliente
      disableErrorMessages: isProduction,
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
  // Dominios permitidos 📕
  logger.log(
    `✅ CORS configurado con ${securityConfig.getAllowedDomains().length} dominios permitidos`,
  );

  // App running log
  logger.log(`🚀 Application is running on: http://${host}:${port}/${apiPrefix}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🔒 Security: ${securityConfig.getAllowedSchemas().length} schemas permitidos`);
}

bootstrap().catch((error) => {
  // Intentar usar el logger centralizado (Winston) para errores fatales de arranque.
  // Si Winston no está disponible (el error ocurrió antes de crear el app),
  // caemos a console.error como fallback de último recurso.
  const fallbackLogger = new Logger('Bootstrap');
  try {
    fallbackLogger.error(`Fatal error during bootstrap: ${error?.message || error}`, error?.stack);
  } catch {
    // Si Logger no está inicializado, usar console como último recurso
    // eslint-disable-next-line no-console
    console.error('Fatal error during bootstrap:', error);
  }
  process.exit(1);
});

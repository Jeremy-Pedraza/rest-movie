import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const isEnabled = configService.get<string>('SWAGGER_ENABLED') === 'true';

  if (!isEnabled) {
    return;
  }

  const title = configService.get<string>('SWAGGER_TITLE') || 'Rest Backend API';
  const description = configService.get<string>('SWAGGER_DESCRIPTION') || 'API REST Documentation';
  const version = configService.get<string>('SWAGGER_VERSION') || '1.0';
  const path = configService.get<string>('SWAGGER_PATH') || 'docs';

  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });
}

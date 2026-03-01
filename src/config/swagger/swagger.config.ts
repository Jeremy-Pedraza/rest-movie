import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const isEnabled = configService.get<string>('SWAGGER_ENABLED') === 'true';

  if (!isEnabled) {
    return;
  }

  const title = configService.get<string>('SWAGGER_TITLE') || 'IDA Media API';
  const description =
    configService.get<string>('SWAGGER_DESCRIPTION') ||
    'API REST para gestion de peliculas y series - IDA';
  const version = configService.get<string>('SWAGGER_VERSION') || '1.0';
  const path = configService.get<string>('SWAGGER_PATH') || 'docs';

  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth()
    .addTag('Auth', 'Autenticacion y autorizacion')
    .addTag('Roles', 'Gestion de roles')
    .addTag('Health', 'Health check endpoints')
    .addTag('Genres', 'Gestion de generos')
    .addTag('Directors', 'Gestion de directores')
    .addTag('Producers', 'Gestion de productoras')
    .addTag('Types', 'Gestion de tipos (pelicula, serie)')
    .addTag('Media', 'Gestion de peliculas y series')
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

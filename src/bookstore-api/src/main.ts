import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  ConsoleLogger,
  INestApplication,
  Logger,
  NestApplicationOptions,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { apiReference } from '@scalar/nestjs-api-reference';
import { log } from 'console';

function useSwaggerModule(app: INestApplication, endpoint: string) {
  const openApi = new DocumentBuilder()
    .setTitle('Bookstore Api')
    .setDescription('The bookstore api swagger ui.')
    .setVersion('1.0')
    .addTag('Bookstore-api')
    .addOAuth2({
      type: 'oauth2',
      flows: {
        password: {
          tokenUrl: `${endpoint}/api/auth/token`,
          authorizationUrl: `${endpoint}/api/auth/token`,
          refreshUrl: `${endpoint}/api/auth/refresh-token`,
          scopes: {
            openid: 'openid',
            profile: 'profile',
            email: 'email',
            roles: 'roles',
            permissions: 'permissions',
          },
        },
      },
    })
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, openApi);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      docExpansion: 'none',
      initOAuth: {
        clientId: 'bookstore-api-client',
        clientSecret: 'bookstore-api-secret',
        scopes: ['openid', 'profile', 'email', 'roles', 'permissions'],
        appName: 'Bookstore Api',
      },
    },
  });

  app.use(
    '/scalar',
    apiReference({
      spec: {
        content: document,
      },
      authentication: {
        preferredSecurityScheme: 'oauth2',
      },
    }),
  );
}

function useCors(app: INestApplication) {
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get('CORS_ALLOW_ORIGINS'),
    credentials: true,
  });
}

async function bootstrap() {
  const appOptions: NestApplicationOptions = {
    logger: new ConsoleLogger({
      logLevels: ['error', 'warn', 'log', 'debug', 'verbose'],
      json: true,
      colors: true,
    }),
  };
  const app = await NestFactory.create(AppModule, appOptions);
  const logger = new Logger(app.constructor.name)

  const configService = app.get(ConfigService);
  const endpoint = configService.get<string>('HTTP_ENDPOINT');
  const port = configService.get<string>('PORT') || 3000;

  app.setGlobalPrefix('/api', { exclude: ['/health'] });
  useCors(app);
  useSwaggerModule(app, endpoint);

  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();

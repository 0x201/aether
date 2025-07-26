import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get('CORS_ALLOW_ORIGINS'),
    credentials: true,
  });
  app.setGlobalPrefix('/api', { exclude: ['/health'] });

  useSwaggerModule(app);

  await app.listen(configService.get<number>('HTTP_PORT') || 3000);
}

function useSwaggerModule(app: INestApplication) {
  const openApi = new DocumentBuilder()
    .setTitle('Nestjs Demo Api')
    .setDescription('The nest js demo api swagger ui.')
    .setVersion('1.0')
    .addTag('Nestjs-demo')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, openApi);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      docExpansion: 'none'
    }
  });
}

bootstrap();

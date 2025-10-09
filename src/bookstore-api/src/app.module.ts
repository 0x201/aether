import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BooksModule } from './books/books.module';
import { AuthorsModule } from './authors/authors.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DataSeedModule } from './data-seed/data-seed.module';
import { SharedModule } from './shared/shared.module';
import { RolesModule } from './roles/roles.module';
import { DatabaseModule } from './database/database.module';
import configuration from './config/configuration';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { KeycloakMiddleware } from './auth/keycloak.middleware';

@Module({
  imports: [
    SharedModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    CacheModule.register(),
    DatabaseModule,
    AuthModule,
    BooksModule,
    AuthorsModule,
    DataSeedModule,
    RolesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(KeycloakMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
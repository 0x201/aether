import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { BooksModule } from "./books/books.module.js";
import { CqrsModule } from "@nestjs/cqrs";
import { AuthorsModule } from "./authors/authors.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { ConfigModule } from "@nestjs/config";
import { DataSeedModule } from "./data-seed/data-seed.module.js";
import { SharedModule } from "./shared/shared.module.js";
import { RolesModule } from "./roles/roles.module.js";
import { DatabaseModule } from "./database/database.module.js";
import configuration from "./config/configuration.js";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./auth/auth.guard.js";
import { KeycloakMiddleware } from "./auth/keycloak.middleware.js";
import { CacheModule } from "./cache/cache.module.js";

@Module({
  imports: [
    SharedModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    AuthModule,
    BooksModule,
    AuthorsModule,
    DataSeedModule,
    RolesModule,
    CacheModule,
    CqrsModule.forRoot(),
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
      .forRoutes({ path: "*path", method: RequestMethod.ALL });
  }
}

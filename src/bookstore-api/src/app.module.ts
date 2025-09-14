import { Module, NestModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BooksModule } from './books/books.module';
import { AuthorsModule } from './authors/authors.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { DataSeedModule } from './data-seed/data-seed.module';
import { SharedModule } from './shared/shared.module';
import { RolesModule } from './roles/roles.module';
import { DatabaseModule } from './database/database.module';
import configuration from './conifg/configuration';
import { MenusModule } from './menus/menus.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`env/.env.${process.env.NODE_ENV || 'development.local'}`],
    }),
    CacheModule.register(),
    DatabaseModule,
    AuthModule,
    RolesModule,
    MenusModule,
    BooksModule,
    AuthorsModule,
    UsersModule,
    DataSeedModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure() {}
}

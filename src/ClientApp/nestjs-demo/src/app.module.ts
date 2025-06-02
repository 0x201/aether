import { Module, NestModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BooksModule } from './books/books.module';
import { AuthorsModule } from './authors/authors.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSeedModule } from './data-seed/data-seed.module';
import { SharedModule } from './shared/shared.module';
import { RolesModule } from './roles/roles.module';
import config from './conifg/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath: ['env/.env.development.local', 'env/.env.development'],
    }),
    CacheModule.register(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        var options = configService.get<TypeOrmModuleOptions>('mysqlConnection');
        return options;
      },
      name: '', 
    }),
    BooksModule,
    AuthorsModule,
    AuthModule,
    UsersModule,
    DataSeedModule,
    SharedModule,
    RolesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure() {}
}

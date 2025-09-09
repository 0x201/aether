import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './services/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtConfig } from './jwt.config';
import { RolesModule } from '../roles/roles.module';
import { CurrentUser } from '../shared/current-user.service';
import { SharedModule } from 'src/shared/shared.module';
import { MenusModule } from 'src/menus/menus.module';

@Module({
  imports: [
    SharedModule,
    UsersModule,
    RolesModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<JwtConfig>('jwtConfig').secret,
        signOptions: {
          expiresIn: configService.get<JwtConfig>('jwtConfig').expiresIn,
        },
      }),
    }),
    MenusModule,
  ],
  providers: [
    AuthService,
    CurrentUser,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule { }
import { MiddlewareConsumer, Module } from '@nestjs/common';
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
import { AuthMiddleware } from './middlewares/auth.middleware';
import { UserContextService } from './services/user-context.service';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<JwtConfig>('jwtConfig').secret,
        signOptions: {
          expiresIn: configService.get<JwtConfig>('jwtConfig').expiresIn,
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    UserContextService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService, UserContextService],
})
export class AuthModule { 
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
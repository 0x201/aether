import { Module } from '@nestjs/common'
import { AuthService } from './services/auth.service'
import { AuthController } from './auth.controller'
import { APP_GUARD } from '@nestjs/core'
import { AuthGuard } from './auth.guard'
import { ConfigModule } from '@nestjs/config'
import { UserContextService } from '../shared/services/user-context.service'
import { SharedModule } from '@/src/shared/shared.module'
import { KeycloakStrategy } from './keycloak.strategy'

@Module({
  imports: [SharedModule, ConfigModule],
  providers: [
    AuthService,
    UserContextService,
    KeycloakStrategy,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService, KeycloakStrategy],
})
export class AuthModule {}

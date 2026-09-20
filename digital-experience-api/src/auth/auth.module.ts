import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { APP_GUARD } from "@nestjs/core"

import { SharedModule } from "@/src/shared/shared.module.js"

import { UserContextService } from "../shared/services/user-context.service.js"
import { AuthController } from "./auth.controller.js"
import { AuthGuard } from "./auth.guard.js"
import { KeycloakStrategy } from "./keycloak.strategy.js"
import { AuthService } from "./services/auth.service.js"

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

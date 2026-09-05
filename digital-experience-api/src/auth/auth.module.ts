import { Module } from "@nestjs/common";
import { AuthService } from "./services/auth.service.js";
import { AuthController } from "./auth.controller.js";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./auth.guard.js";
import { ConfigModule } from "@nestjs/config";
import { UserContextService } from "../shared/services/user-context.service.js";
import { SharedModule } from "@/src/shared/shared.module.js";
import { KeycloakStrategy } from "./keycloak.strategy.js";

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

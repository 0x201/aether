import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SharedModule } from "@/src/shared/shared.module.js";
import { Role } from "./entities/role.entity.js";
import { RolesService } from "./roles.service.js";
import { RolesController } from "./roles.controller.js";
import { RoleGuard } from "./role.guard.js";
import { APP_GUARD } from "@nestjs/core";

@Module({
  imports: [TypeOrmModule.forFeature([Role]), SharedModule],
  providers: [
    RolesService,
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
  exports: [RolesService],
  controllers: [RolesController],
})
export class RolesModule {}

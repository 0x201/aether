import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MenusService } from "./menus.service.js";
import { MenusController } from "./menus.controller.js";
import { Menu } from "./entities/menu.entity.js";
import { JwtModule } from "@nestjs/jwt";
import { SharedModule } from "@/src/shared/shared.module.js";
import { RolesModule } from "@/src/roles/roles.module.js";
import { AuthModule } from "@/src/auth/auth.module.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([Menu]),
    AuthModule,
    JwtModule,
    RolesModule,
    SharedModule,
  ],
  providers: [MenusService],
  controllers: [MenusController],
  exports: [MenusService],
})
export class MenusModule {}

import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { TypeOrmModule } from "@nestjs/typeorm"

import { AuthModule } from "@/src/auth/auth.module.js"
import { RolesModule } from "@/src/roles/roles.module.js"
import { SharedModule } from "@/src/shared/shared.module.js"

import { Menu } from "./entities/menu.entity.js"
import { MenusController } from "./menus.controller.js"
import { MenusService } from "./menus.service.js"

@Module({
  imports: [TypeOrmModule.forFeature([Menu]), AuthModule, JwtModule, RolesModule, SharedModule],
  providers: [MenusService],
  controllers: [MenusController],
  exports: [MenusService],
})
export class MenusModule {}

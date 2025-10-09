import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { Menu } from './entities/menu.entity';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from 'src/shared/shared.module';
import { RolesModule } from 'src/roles/roles.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Menu]), AuthModule, JwtModule, RolesModule, SharedModule],
  providers: [MenusService],
  controllers: [MenusController],
  exports: [MenusService],
})
export class MenusModule {}

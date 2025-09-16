import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { Menu } from './entities/menu.entity';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from 'src/shared/shared.module';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [TypeOrmModule.forFeature([Menu]), JwtModule, RolesModule, SharedModule],
  providers: [MenusService],
  controllers: [MenusController],
  exports: [MenusService],
})
export class MenusModule {}

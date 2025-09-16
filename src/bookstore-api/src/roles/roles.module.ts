import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'src/shared/shared.module';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { RoleGuard } from './role.guard';
import { APP_GUARD } from '@nestjs/core';

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

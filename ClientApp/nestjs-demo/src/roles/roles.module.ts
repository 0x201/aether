import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'src/shared/shared.module';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Role]), SharedModule],
    providers: [RolesService],
    exports: [RolesService],
    controllers: [RolesController],
})
export class RolesModule { }

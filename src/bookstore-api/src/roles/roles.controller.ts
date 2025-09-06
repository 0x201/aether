import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleCommand } from './commands/create-role.command';
import { UpdateRoleCommand } from './commands/update-role.command';
import { Role } from './entities/role.entity';
import { RoleDto } from './dtos/role.dto';
import { PagedResult } from 'src/common/response/ListResultResponse';
import { RoleQuery } from './queries/role.query';
import { Roles } from './role.decorator';
import { RoleEnum } from './role.enum';

@Roles(RoleEnum.Admin)
@ApiTags('Roles')
@Controller('roles')
@ApiBearerAuth()
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all roles' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Return all roles', type: PagedResult<RoleDto> })
    async getAllRoles(@Query() query: RoleQuery): Promise<PagedResult<RoleDto>> {
        const [roles, totalCount] = await this.rolesService.findAll(query);
        const items: RoleDto[] = roles.map((x) => Object.assign(new RoleDto(), x));
        return new PagedResult<RoleDto>(items, totalCount);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a role by id' })
    @ApiParam({ name: 'id', description: 'Role id' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Return role by id', type: RoleDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
    async getRoleById(@Param('id', ParseIntPipe) id: number): Promise<Role> {
        return this.rolesService.findById(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new role' })
    @ApiBody({ type: CreateRoleCommand })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Role created successfully', type: RoleDto })
    async createRole(@Body() createRoleCommand: CreateRoleCommand): Promise<Role> {
        return this.rolesService.insert(createRoleCommand);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a role' })
    @ApiParam({ name: 'id', description: 'Role id' })
    @ApiBody({ type: UpdateRoleCommand })
    @ApiResponse({ status: HttpStatus.OK, description: 'Role updated successfully', type: RoleDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
    async updateRole(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateRoleCommand: UpdateRoleCommand
    ): Promise<Role> {
        return this.rolesService.update(id, updateRoleCommand);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a role' })
    @ApiParam({ name: 'id', description: 'Role id' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Role deleted successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
    async deleteRole(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.rolesService.remove(id);
    }
}
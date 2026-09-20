import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpStatus,
  Query,
  UseGuards,
} from "@nestjs/common"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger"

import { PagedResult } from "@/src/common/response/Result.js"

import { CreateRoleCommand } from "./commands/create-role.command.js"
import { UpdateRoleCommand } from "./commands/update-role.command.js"
import { RoleDto } from "./dtos/role.dto.js"
import { Role } from "./entities/role.entity.js"
import { RoleQuery } from "./queries/role.query.js"
import { Roles } from "./role.decorator.js"
import { RoleEnum } from "./role.enum.js"
import { RoleGuard } from "./role.guard.js"
import { RolesService } from "./roles.service.js"

@UseGuards(RoleGuard)
@Roles(RoleEnum.Admin)
@ApiTags("Roles")
@Controller("roles")
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: "Get roles with paged list" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Return all roles",
    type: PagedResult<RoleDto>,
  })
  async findPaginatedList(@Query() query: RoleQuery): Promise<PagedResult<RoleDto>> {
    const [roles, totalCount] = await this.rolesService.findRoles(query)
    const data: RoleDto[] = roles.map((role) => Role.mapRoleToRoleDto(role))
    return new PagedResult<RoleDto>(data, totalCount)
  }

  @Get("/all")
  @ApiOperation({ summary: "Get all roles" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Return all roles",
    type: PagedResult<RoleDto>,
  })
  async getAllRoles(): Promise<RoleDto[]> {
    const roles = await this.rolesService.findAllRoles()
    return roles.map((x) => Role.mapRoleToRoleDto(x))
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a role by id" })
  @ApiParam({ name: "id", description: "Role id" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Return role by id",
    type: RoleDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Role not found" })
  async getRoleById(@Param("id", ParseIntPipe) id: number): Promise<Role> {
    return this.rolesService.findOne(id)
  }

  @Post()
  @ApiOperation({ summary: "Create a new role" })
  @ApiBody({ type: CreateRoleCommand })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Role created successfully",
    type: RoleDto,
  })
  async createRole(@Body() createRoleCommand: CreateRoleCommand): Promise<Role> {
    return this.rolesService.insert(createRoleCommand)
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a role" })
  @ApiParam({ name: "id", description: "Role id" })
  @ApiBody({ type: UpdateRoleCommand })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Role updated successfully",
    type: RoleDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Role not found" })
  async updateRole(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateRoleCommand: UpdateRoleCommand,
  ): Promise<Role> {
    return this.rolesService.update(id, updateRoleCommand)
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a role" })
  @ApiParam({ name: "id", description: "Role id" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Role deleted successfully",
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Role not found" })
  async deleteRole(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.rolesService.delete(id)
  }
}

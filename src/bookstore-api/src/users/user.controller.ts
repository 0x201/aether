import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, Query, HttpException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SignUpUserCommand as SignupUserCommand } from './commands/signup-user.command';
import { UpdateUserCommand } from './commands/update-user.command';
import { UserDto } from './dtos/user.dto';
import { UserQuery } from './queries/user.query';
import { PagedResult } from 'src/common/response/ListResultResponse';
import { Roles } from 'src/roles/role.decorator';
import { RoleEnum } from 'src/roles/role.enum';
import { User } from './entities/user.entity';
import { RoleDto } from 'src/roles/dtos/role.dto';

@Roles(RoleEnum.Admin)
@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @ApiOperation({ summary: 'Get users with paged list' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return users with paged list', type: PagedResult<UserDto> })
  async findAll(@Query() query: UserQuery): Promise<PagedResult<UserDto>> {
    const [users, totalCount] = await this.usersService.findPaginatedUsers(query);
    const items = users.map((user) => this.mapUserToUserDto(user));
    return new PagedResult<UserDto>(items, totalCount);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return user by id', type: UserDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserDto> {
    const user = await this.usersService.findOneWithRoles(id);
    if (!user) {
      throw new HttpException(`Cannot find the user with id ${id}`, 404);
    }
    return user;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: SignupUserCommand })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully', type: UserDto })
  async createUser(@Body() signUpUserCommand: SignupUserCommand): Promise<UserDto> {
    const user = await this.usersService.insert(signUpUserCommand);
    return this.mapUserToUserDto(user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiBody({ type: UpdateUserCommand })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully', type: UserDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserCommand: UpdateUserCommand
  ): Promise<void> {
    await this.usersService.update(id, updateUserCommand);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.usersService.remove(id);
  }


  private mapUserToUserDto(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.username = user.username;
    dto.nickname = user.nickname;
    dto.isActive = user.isActive;
    dto.createdTime = user.createdTime;
    dto.lastModifiedTime = user.lastModifiedTime;
    dto.roles = user.userRoles.map((userRole) => {
      const roleDto = new RoleDto();
      roleDto.name = userRole.role.name;
      roleDto.id = userRole.role.id;
      return roleDto;     
    });
    return dto;
  }
}
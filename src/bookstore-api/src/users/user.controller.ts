import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SignUpUserCommand } from './commands/signup-user.command';
import { UpdateUserCommand } from './commands/update-user.command';
import { UserDto } from './dtos/user.dto';
import { UserQuery } from './queries/user.query';
import { PagedResult } from 'src/common/response/ListResultResponse';
import { Roles } from 'src/roles/role.decorator';
import { RoleEnum } from 'src/roles/role.enum';

@Roles(RoleEnum.Admin)
@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all users', type: PagedResult<UserDto> })
  async getAllUsers(@Query() query: UserQuery): Promise<PagedResult<UserDto>> {
    const [users, totalCount] = await this.usersService.findAll(query);
    const items: UserDto[] = users.map(user => {
      return Object.assign(new UserDto(), user);
    });
    return new PagedResult<UserDto>(items, totalCount);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return user by id', type: UserDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async getUserById(@Param('id', ParseIntPipe) id: number): Promise<UserDto> {
    return this.usersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: SignUpUserCommand })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully', type: UserDto })
  async createUser(@Body() signUpUserCommand: SignUpUserCommand): Promise<UserDto> {
    return this.usersService.insert(signUpUserCommand);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiBody({ type: UpdateUserCommand })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully', type: UserDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserCommand: UpdateUserCommand
  ): Promise<UserDto> {
    return this.usersService.update(id, updateUserCommand);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
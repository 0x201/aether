import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { Menu } from './entities/menu.entity';
import { MenuDto } from './dtos/menu.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserPayload } from '../shared/services/user-context.service';
import { MenuQuery } from './queries/menu.query';
import { PagedResult } from 'src/common/response/ListResultResponse';
import { CreateMenuCommand } from './commands/create-menu.command';
import { UpdateMenuCommand } from './commands/update-menu.command';

@Controller('menus')
@ApiTags('Menus')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get('user')
  @ApiOperation({ summary: 'Get menus for current user' })
  @ApiResponse({
    status: 200,
    description: 'Return menus for current user',
    type: [MenuDto],
  })
  async getUserMenus(@CurrentUser() user: UserPayload): Promise<MenuDto[]> {
    const menus = await this.menusService.getUserMenus(Number(user.sub));
    return menus.map((menu) => this.mapToDto(menu));
  }

  @Get()
  @ApiOperation({ summary: 'Get all menus' })
  @ApiResponse({
    status: 200,
    description: 'Return all menus',
    type: [Menu],
  })
  async getAllMenus(@Query() query: MenuQuery): Promise<PagedResult<MenuDto>> {
    const [menus, totalCount] = await this.menusService.findMenus(query);

    return new PagedResult<MenuDto>(
      menus.map((menu) => this.mapToDto(menu)),
      totalCount,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new menu' })
  @ApiResponse({
    status: 201,
    description: 'Menu created successfully',
    type: Menu,
  })
  async createMenu(@Body() menu: CreateMenuCommand): Promise<Menu> {
    return await this.menusService.insert(menu);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a menu' })
  @ApiResponse({
    status: 200,
    description: 'Menu updated successfully',
    type: Menu,
  })
  async updateMenu(
    @Param('id', ParseIntPipe) id: number,
    @Body() menuToUpdate: UpdateMenuCommand,
  ): Promise<MenuDto> {
    const menu = await this.menusService.update(id, menuToUpdate);
    return this.mapToDto(menu);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a menu' })
  @ApiResponse({
    status: 200,
    description: 'Menu deleted successfully',
  })
  async deleteMenu(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.menusService.delete(id);
  }

  private mapToDto(menu: Menu): MenuDto {
    return {
      id: menu.id,
      name: menu.name,
      title: menu.title,
      icon: menu.icon,
      route: menu.route,
      order: menu.order,
      parentId: menu.parentId,
      isActive: menu.isActive,
    };
  }
}

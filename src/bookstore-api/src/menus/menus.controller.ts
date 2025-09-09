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
import { UserPayload } from '../shared/current-user.service';

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
    return await this.menusService.getUserMenus(Number(user.sub));
  }

  @Get()
  @ApiOperation({ summary: 'Get all menus' })
  @ApiResponse({
    status: 200,
    description: 'Return all menus',
    type: [Menu],
  })
  async getAllMenus(): Promise<Menu[]> {
    return await this.menusService.getAllMenus();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new menu' })
  @ApiResponse({
    status: 201,
    description: 'Menu created successfully',
    type: Menu,
  })
  async createMenu(@Body() menu: Partial<Menu>): Promise<Menu> {
    return await this.menusService.createMenu(menu);
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
    @Body() menu: Partial<Menu>,
  ): Promise<Menu> {
    return await this.menusService.updateMenu(id, menu);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a menu' })
  @ApiResponse({
    status: 200,
    description: 'Menu deleted successfully',
  })
  async deleteMenu(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.menusService.deleteMenu(id);
  }
}
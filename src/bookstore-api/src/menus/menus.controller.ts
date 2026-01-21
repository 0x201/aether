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
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
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
import { PagedResult } from 'src/common/response/Result';
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
    const menus = await this.menusService.getUserMenus(user.roles);
    return menus.map((menu) => Menu.mapToDto(menu));
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
      menus.map((menu) => Menu.mapToDto(menu)),
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
  async createMenu(@Body() menuToAdd: CreateMenuCommand, @Res() res: Response): Promise<void> {
    const menu = await this.menusService.insert(menuToAdd);
    res.status(HttpStatus.CREATED).location(`/api/menus/${menu.id}`).send();
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
    @Res() res: Response,
  ): Promise<void> {
    const menu = await this.menusService.update(id, menuToUpdate);
    const menuDto = Menu.mapToDto(menu);
    res.status(200).json(menuDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a menu' })
  @ApiResponse({
    status: 204,
    description: 'Menu deleted successfully',
  })
  async deleteMenu(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    await this.menusService.delete(id);
    res.status(204).send();
  }
}
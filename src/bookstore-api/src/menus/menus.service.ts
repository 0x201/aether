import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';
import { MenuDto } from './dtos/menu.dto';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async getUserMenus(userId: number): Promise<MenuDto[]> {
    const userMenus = await this.menuRepository
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.roles', 'role')
      .leftJoin('role.userRoles', 'userRole')
      .where('userRole.userId = :userId', { userId })
      .andWhere('menu.isActive = :isActive', { isActive: true })
      .orderBy('menu.order', 'ASC')
      .getMany();

    return userMenus.map(menu => {
      const dto = new MenuDto();
      dto.id = menu.id;
      dto.name = menu.name;
      dto.title = menu.title;
      dto.icon = menu.icon;
      dto.route = menu.route;
      dto.order = menu.order;
      dto.parentId = menu.parentId;
      dto.isActive = menu.isActive;
      dto.roles = menu.roles.map(role => role.name);
      return dto;
    });
  }

  async getAllMenus(): Promise<Menu[]> {
    return await this.menuRepository.find({
      where: { isActive: true },
      order: { order: 'ASC' },
    });
  }

  async createMenu(menu: Partial<Menu>): Promise<Menu> {
    const newMenu = this.menuRepository.create(menu);
    return await this.menuRepository.save(newMenu);
  }

  async createMany(menus: Partial<Menu>[]): Promise<Menu[]> {
    return await this.menuRepository.save(menus);
  }

  async updateMenu(id: number, menu: Partial<Menu>): Promise<Menu> {
    await this.menuRepository.update(id, menu);
    return await this.menuRepository.findOne({ where: { id } });
  }

  async deleteMenu(id: number): Promise<void> {
    await this.menuRepository.delete(id);
  }

  async count(): Promise<number> {
    return await this.menuRepository.count();
  }
}
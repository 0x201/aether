import { RoleDto } from 'src/roles/dtos/role.dto';
import { MenuDto } from 'src/menus/dtos/menu.dto';

export interface JwtPayload {
  sub: string;
  username: string;
  nickname: string;
  roles: RoleDto[];
  permissions: string[];
  menus: MenuDto[];
}

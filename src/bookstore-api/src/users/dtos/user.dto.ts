import { RoleDto } from "src/roles/dtos/role.dto";

export class UserDto {
  id: number;
  username: string;
  nickname: string;
  isActive: boolean;
  createdTime: string;
  lastModifiedTime: string;
  roles: RoleDto[];
}

import { RoleDto } from '@/src/roles/dtos/role.dto'

export interface UpdateMenuCommand {
  roles: RoleDto[]
  icon: string
  isActive: boolean
  name: string
  order: number
  parentId: number
  route: string
  title: string
}

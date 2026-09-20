import { Role } from './role.model'

export interface Menu {
  id: number
  name: string
  title: string
  icon: string
  route: string
  order: number
  parentId: number
  isActive: boolean
  roles: Role[]
  children?: Menu[]
}

export interface CreateOrUpdateMenuCommand {
  name: string
  title: string
  icon: string
  route: string
  order: number
  parentId: number
  roles: Role[]
}

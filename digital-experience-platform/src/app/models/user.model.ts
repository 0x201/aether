import { Role } from './role.model'

export interface User {
  id: number
  username: string
  nickname: string
  isActive: boolean
  roles: Role[]
}

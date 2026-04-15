import { ApiProperty } from '@nestjs/swagger'
import { RoleDto } from '@/src/roles/dtos/role.dto'

export class CreateMenuCommand {
  @ApiProperty()
  name: string
  @ApiProperty()
  title: string
  @ApiProperty()
  icon: string
  @ApiProperty()
  route: string
  @ApiProperty()
  order: number
  @ApiProperty()
  parentId: number
  @ApiProperty()
  roles: RoleDto[]
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateAuthorCommand {
  @ApiProperty()
  firstName: string
  @ApiProperty()
  lastName: string
  @ApiPropertyOptional()
  isActive?: boolean
}

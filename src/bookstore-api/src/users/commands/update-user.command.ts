import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleDto } from 'src/roles/dtos/role.dto';

export class UpdateUserCommand {
  @ApiProperty()
  username: string;

  @ApiProperty()
  nickname?: string;

  @ApiPropertyOptional()
  roles?: RoleDto[];

  @ApiPropertyOptional()
  password?: string;

  @ApiProperty()
  isActive: boolean;
}

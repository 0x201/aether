import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserCommand {
  @ApiProperty()
  username: string;

  @ApiProperty()
  nickname?: string;

  @ApiPropertyOptional()
  roleIds?: number[];

  @ApiPropertyOptional()
  password?: string;

  @ApiProperty()
  isActive: boolean;
}

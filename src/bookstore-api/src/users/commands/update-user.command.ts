import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserCommand {
  @ApiProperty()
  username: string;
  
  @ApiProperty()
  nickname: string;
  
  @ApiProperty()
  isActive: boolean;
}
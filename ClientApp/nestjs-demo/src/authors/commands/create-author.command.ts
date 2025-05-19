import { ApiProperty } from '@nestjs/swagger';

export class CreateAuthorCommand {
  @ApiProperty()
  firstName: string;
  @ApiProperty()
  lastName: string;
}

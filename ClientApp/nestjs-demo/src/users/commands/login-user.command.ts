import { ApiProperty } from '@nestjs/swagger';

export class SignInUserCommand {
  @ApiProperty()
  username: string;
  @ApiProperty()
  password: string;
}

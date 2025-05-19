import { ApiProperty } from '@nestjs/swagger';
import { SignInUserCommand } from './login-user.command';

export class SignUpUserCommand extends SignInUserCommand {
  @ApiProperty()
  roles: string[];
  @ApiProperty()
  nickname: string;
}

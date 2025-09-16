import { ApiProperty } from '@nestjs/swagger';
import { SignInUserCommand } from './login-user.command';

export class SignUpUserCommand extends SignInUserCommand {
  @ApiProperty()
  roleIds: number[];
  @ApiProperty()
  nickname: string;
}

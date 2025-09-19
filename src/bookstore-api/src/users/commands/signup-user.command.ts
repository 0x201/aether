import { ApiProperty } from '@nestjs/swagger';
import { SignInUserCommand } from './login-user.command';
import { RoleDto } from 'src/roles/dtos/role.dto';

export class SignUpUserCommand extends SignInUserCommand {
  @ApiProperty()
  roles: RoleDto[];
  @ApiProperty()
  nickname: string;
}

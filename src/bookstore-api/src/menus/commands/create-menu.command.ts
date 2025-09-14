import { ApiProperty } from "@nestjs/swagger";

export class CreateMenuCommand {
  @ApiProperty()
  name: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  icon: string;
  @ApiProperty()
  route: string;
  @ApiProperty()
  order: number;
  @ApiProperty()
  parentId: number;
  @ApiProperty()
  roleIds: number[];
}
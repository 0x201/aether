import { ApiProperty } from '@nestjs/swagger';

export class MenuDto {
  @ApiProperty()
  id: number;

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
  isActive: boolean;
}

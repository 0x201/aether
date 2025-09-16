import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookCommand {
  @ApiProperty()
  title: string;
  @ApiProperty()
  isbn: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  publishDate: string;
  @ApiProperty()
  price: number;
  @ApiProperty()
  authorIds: number[];
  @ApiPropertyOptional()
  isActive?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthorDto } from 'src/authors/dtos/author.dto';

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
  authors: AuthorDto[];
  @ApiPropertyOptional()
  isActive?: boolean;
}

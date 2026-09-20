import { ApiProperty } from "@nestjs/swagger"

import { AuthorDto } from "@/src/authors/dtos/author.dto.js"

export class BookDto {
  @ApiProperty()
  id: number
  @ApiProperty()
  isbn: string
  @ApiProperty()
  title: string
  @ApiProperty()
  price: number
  @ApiProperty()
  description: string
  @ApiProperty()
  publishDate: string
  @ApiProperty()
  isActive: boolean

  @ApiProperty()
  authors: AuthorDto[]
}

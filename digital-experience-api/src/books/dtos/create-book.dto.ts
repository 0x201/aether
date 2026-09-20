import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, IsArray } from "class-validator"

import { AuthorDto } from "@/src/authors/dtos/author.dto.js"

export class CreateBookDto {
  @ApiProperty({ description: "Book Title" })
  @IsString()
  title: string

  @ApiProperty({ description: "ISBN" })
  @IsString()
  isbn: string

  @ApiProperty({ description: "Book Description" })
  @IsString()
  description: string

  @ApiProperty({ description: "Publish Date" })
  @IsDateString()
  publishDate: string

  @ApiProperty({ description: "Price" })
  @IsNumber()
  price: number

  @ApiProperty({ description: "Author List" })
  @IsArray()
  authors: AuthorDto[]

  @ApiPropertyOptional({ description: "Is Active" })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

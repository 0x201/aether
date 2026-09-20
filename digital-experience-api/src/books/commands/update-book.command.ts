import { ApiProperty } from "@nestjs/swagger"
import { IsNumber } from "class-validator"

import { UpdateBookDto } from "../dtos/update-book.dto.js"
import { CreateBookCommand } from "./create-book.command.js"

export class UpdateBookCommand extends UpdateBookDto {
  @ApiProperty({ description: "Book ID" })
  @IsNumber()
  id: number

  constructor(id: number, data: Partial<CreateBookCommand> = {}) {
    super()
    this.id = id
    Object.assign(this, data)
  }
}

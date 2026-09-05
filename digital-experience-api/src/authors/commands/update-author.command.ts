import { ApiProperty } from "@nestjs/swagger";
import { UpdateAuthorDto } from "../dtos/update-author.dto.js";
import { IsNumber } from "class-validator";

export class UpdateAuthorCommand extends UpdateAuthorDto {
  @ApiProperty({ description: "Book ID" })
  @IsNumber()
  id: number;

  constructor(id: number, data: UpdateAuthorDto) {
    super();
    this.id = id;
    Object.assign(this, data);
  }
}

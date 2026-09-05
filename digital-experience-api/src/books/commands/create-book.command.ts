import { CreateBookDto } from "../dtos/create-book.dto.js";

export class CreateBookCommand extends CreateBookDto {
  constructor(data: CreateBookDto) {
    super();
    Object.assign(this, data);
  }
}

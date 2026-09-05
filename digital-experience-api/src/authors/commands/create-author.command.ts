import { CreateAuthorDto } from "../dtos/create-author.dto.js";

export class CreateAuthorCommand extends CreateAuthorDto {
  constructor(data: CreateAuthorDto) {
    super();
    Object.assign(this, data);
  }
}

import { PartialType } from '@nestjs/swagger';
import { CreateAuthorCommand } from './create-author.command';

export class UpdateAuthorCommand extends PartialType(CreateAuthorCommand) {}

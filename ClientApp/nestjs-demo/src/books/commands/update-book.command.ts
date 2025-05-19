import { PartialType } from '@nestjs/swagger';
import { CreateBookCommand } from './create-book.command';

export class UpdateBookCommand extends PartialType(CreateBookCommand) {}

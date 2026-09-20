import { Module } from "@nestjs/common"
import { CqrsModule } from "@nestjs/cqrs"
import { TypeOrmModule } from "@nestjs/typeorm"

import { AuthModule } from "@/src/auth/auth.module.js"
import { SharedModule } from "@/src/shared/shared.module.js"

import { AuthorsModule } from "../authors/authors.module.js"
import { BooksController } from "./books.controller.js"
import { BooksService } from "./books.service.js"
import { Book } from "./entities/book.entity.js"
import { CreateBookHandler } from "./handlers/create-book.handler.js"
import { DeleteBookHandler } from "./handlers/delete-book.handler.js"
import { GetBookHandler } from "./handlers/get-book.handler.js"
import { GetBooksHandler } from "./handlers/get-books.handler.js"
import { UpdateBookHandler } from "./handlers/update-book.handler.js"

@Module({
  imports: [AuthorsModule, TypeOrmModule.forFeature([Book]), AuthModule, SharedModule, CqrsModule],
  controllers: [BooksController],
  providers: [
    BooksService,
    CreateBookHandler,
    UpdateBookHandler,
    DeleteBookHandler,
    GetBooksHandler,
    GetBookHandler,
  ],
  exports: [BooksService],
})
export class BooksModule {}

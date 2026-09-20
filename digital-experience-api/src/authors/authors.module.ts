import { Module } from "@nestjs/common"
import { CqrsModule } from "@nestjs/cqrs"
import { TypeOrmModule } from "@nestjs/typeorm"

import { AuthModule } from "@/src/auth/auth.module.js"
import { SharedModule } from "@/src/shared/shared.module.js"

import { AuthorsController } from "./authors.controller.js"
import { AuthorsService } from "./authors.service.js"
import { Author } from "./entities/author.entity.js"
import { CreateAuthorHandler } from "./handlers/create-author.handler.js"
import { DeleteAuthorHandler } from "./handlers/delete-author.handler.js"
import { GetAuthorHandler } from "./handlers/get-author.handler.js"
import { GetAuthorsHandler } from "./handlers/get-authors.handler.js"
import { UpdateAuthorHandler } from "./handlers/update-author.handler.js"

@Module({
  imports: [TypeOrmModule.forFeature([Author]), AuthModule, SharedModule, CqrsModule],
  controllers: [AuthorsController],
  providers: [
    AuthorsService,
    GetAuthorHandler,
    GetAuthorsHandler,
    CreateAuthorHandler,
    UpdateAuthorHandler,
    DeleteAuthorHandler,
  ],
  exports: [AuthorsService],
})
export class AuthorsModule {}

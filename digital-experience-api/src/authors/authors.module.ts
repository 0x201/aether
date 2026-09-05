import { Module } from "@nestjs/common";
import { AuthorsService } from "./authors.service.js";
import { AuthorsController } from "./authors.controller.js";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Author } from "./entities/author.entity.js";
import { SharedModule } from "@/src/shared/shared.module.js";
import { AuthModule } from "@/src/auth/auth.module.js";
import { CqrsModule } from "@nestjs/cqrs";
import { GetAuthorHandler } from "./handlers/get-author.handler.js";
import { GetAuthorsHandler } from "./handlers/get-authors.handler.js";
import { CreateAuthorHandler } from "./handlers/create-author.handler.js";
import { UpdateAuthorHandler } from "./handlers/update-author.handler.js";
import { DeleteAuthorHandler } from "./handlers/delete-author.handler.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([Author]),
    AuthModule,
    SharedModule,
    CqrsModule,
  ],
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

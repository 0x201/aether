import { Global, Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm"

import { Menu } from "@/src/menus/entities/menu.entity.js"
import { RoleMenu } from "@/src/menus/entities/role-menu.entity.js"
import { Role } from "@/src/roles/entities/role.entity.js"
import { SharedModule } from "@/src/shared/shared.module.js"

import { Author } from "../authors/entities/author.entity.js"
import { BookAuthor } from "../books/entities/book-author.entity.js"
import { Book } from "../books/entities/book.entity.js"

@Global()
@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config: TypeOrmModuleOptions = {
          type: "postgres",
          username: configService.get("database.username"),
          host: configService.get("database.host"),
          port: configService.get("database.port"),
          password: configService.get("database.password"),
          database: configService.get("database.database"),
          entities: [Author, Book, BookAuthor, Role, Menu, RoleMenu],
          synchronize: configService.get("database.synchronize"),
          logging: configService.get("database.logging"),
          autoLoadEntities: configService.get("database.autoLoadEntities"),
          schema: configService.get("database.schema"),
        }
        return config
      },
      name: "",
    }),
  ],
})
export class DatabaseModule {}

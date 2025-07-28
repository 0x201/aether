import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Author } from '../authors/entities/author.entity';
import { Book } from '../books/entities/book.entity';
import { BookAuthor } from '../books/entities/book-author.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.entity';


@Global()
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const config: TypeOrmModuleOptions = {
                    type: 'mssql',
                    username: configService.get('database.username'),
                    host: configService.get('database.host'),
                    port: configService.get('database.port'),
                    password: configService.get('database.password'),
                    database: configService.get('database.database'),
                    entities: [Author, Book, BookAuthor, Role, User, UserRole],
                    pool: configService.get('database.pool'),
                    options: configService.get('database.options'),
                    synchronize: configService.get('database.synchronize'),
                    logging: configService.get('database.logging'),
                    autoLoadEntities: configService.get('database.autoLoadEntities')
                }
                return config;
            },
            name: '',
        }),
    ]
})
export class DatabaseModule { }

import { Module } from '@nestjs/common';
import { DataSeedService } from './data-seed.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from 'src/books/entities/book.entity';
import { Author } from 'src/authors/entities/author.entity';
import { Role } from 'src/users/entities/role.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, Author, Role, User])
  ],
  providers: [DataSeedService],
  exports: [DataSeedService]
})
export class DataSeedModule {}

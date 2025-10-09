import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { AuthorsModule } from '../authors/authors.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { SharedModule } from 'src/shared/shared.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthorsModule, TypeOrmModule.forFeature([Book]), AuthModule, SharedModule],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}

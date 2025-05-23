import { Module } from '@nestjs/common';
import { DataSeedService } from './data-seed.service';
import { UsersModule } from 'src/users/users.module';
import { RolesModule } from 'src/roles/roles.module';
import { BooksModule } from 'src/books/books.module';
import { AuthorsModule } from 'src/authors/authors.module';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    BooksModule,
    AuthorsModule
  ],
  providers: [DataSeedService],
  exports: [DataSeedService]
})
export class DataSeedModule {}

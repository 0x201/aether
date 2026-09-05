import { Module } from '@nestjs/common'
import { DataSeedService } from './data-seed.service.js'
import { RolesModule } from '@/src/roles/roles.module.js'
import { BooksModule } from '@/src/books/books.module.js'
import { AuthorsModule } from '@/src/authors/authors.module.js'
import { MenusModule } from '@/src/menus/menus.module.js'

@Module({
  imports: [RolesModule, BooksModule, AuthorsModule, MenusModule],
  providers: [DataSeedService],
  exports: [DataSeedService],
})
export class DataSeedModule {}

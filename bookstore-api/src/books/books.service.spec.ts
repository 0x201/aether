import { Test, TestingModule } from '@nestjs/testing'
import { BooksService } from './books.service'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Book } from './entities/book.entity'
import { Author } from '@/src/authors/entities/author.entity'
import { testTypeOrmConfig } from '@/test/typeorm-test.config'
import { describe, beforeEach, it, expect } from 'vitest'

describe('BooksService', () => {
  let service: BooksService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync(testTypeOrmConfig),
        TypeOrmModule.forFeature([Book, Author]),
      ],
      providers: [BooksService],
    }).compile()

    service = module.get<BooksService>(BooksService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

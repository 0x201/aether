import { Test, TestingModule } from '@nestjs/testing'
import { DataSeedService } from './data-seed.service'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { describe, beforeEach, it, expect } from 'vitest'
import { Role } from '@/src/roles/entities/role.entity'
import { Author } from '@/src/authors/entities/author.entity'
import { Book } from '@/src/books/entities/book.entity'
import { testTypeOrmConfig } from '@/test/typeorm-test.config'

describe('DataSeedService', () => {
  let service: DataSeedService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync(testTypeOrmConfig),
        TypeOrmModule.forFeature([Role, Author, Book]),
      ],
      providers: [DataSeedService],
    }).compile()

    service = module.get<DataSeedService>(DataSeedService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

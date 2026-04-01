import { Test, TestingModule } from '@nestjs/testing'
import { AuthorsService } from './authors.service'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Author } from './entities/author.entity'
import { testTypeOrmConfig } from '@/test/typeorm-test.config'
import { describe, beforeEach, it, expect } from 'vitest'

describe('AuthorsService', () => {
  let service: AuthorsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync(testTypeOrmConfig),
        TypeOrmModule.forFeature([Author]),
      ],
      providers: [AuthorsService],
    }).compile()

    service = module.get<AuthorsService>(AuthorsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { RedisService } from './redis.service'
import { ConfigModule } from '@nestjs/config'
import { describe, beforeEach, it, expect } from 'vitest'

describe('RedisService', () => {
  let service: RedisService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [RedisService],
    }).compile()

    service = module.get<RedisService>(RedisService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

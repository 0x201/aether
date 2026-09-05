import { Test, TestingModule } from '@nestjs/testing'
import { RolesService } from './roles.service.js'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Role } from './entities/role.entity.js'
import { ConfigModule } from '@nestjs/config'
import { testTypeOrmConfig } from '@/test/typeorm-test.config.js'
import { describe, beforeEach, it, expect } from 'vitest'

describe('RolesService', () => {
  let service: RolesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync(testTypeOrmConfig),
        TypeOrmModule.forFeature([Role]),
      ],
      providers: [RolesService],
    }).compile()

    service = module.get<RolesService>(RolesService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

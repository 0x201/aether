import { Test, TestingModule } from '@nestjs/testing'
import { AuthorsController } from './authors.controller'
import { AuthorsService } from './authors.service'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('AuthorsController', () => {
  let controller: AuthorsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorsController],
      providers: [
        AuthorsService,
        {
          provide: AuthorsService,
          useValue: {
            create: vi.fn(),
            findAll: vi.fn(),
            findOne: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<AuthorsController>(AuthorsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { JwtService } from '@nestjs/jwt'
import { CryptoService } from '@/src/shared/services/crypto.service'
import { ConfigModule } from '@nestjs/config'
import { describe, beforeEach, vi, it, expect } from 'vitest'

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: vi.fn(),
            verifyAsync: vi.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            hash: vi.fn(),
            compare: vi.fn(),
          },
        },
      ],
    }).compile()

    authService = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(authService).toBeDefined()
  })
})

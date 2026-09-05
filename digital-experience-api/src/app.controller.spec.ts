import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { ConfigModule } from '@nestjs/config'
import { describe, beforeEach, it, expect } from 'vitest'

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [AppController],
      providers: [AppService],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('root', () => {
    it('should return "Healthy"', () => {
      expect(appController.health()).toBe('Healthy')
    })
  })
})

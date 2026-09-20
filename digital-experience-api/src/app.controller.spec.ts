import { ConfigModule } from "@nestjs/config"
import { Test, TestingModule } from "@nestjs/testing"
import { describe, beforeEach, it, expect } from "vitest"

import { AppController } from "./app.controller.js"
import { AppService } from "./app.service.js"

describe("AppController", () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [AppController],
      providers: [AppService],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe("root", () => {
    it('should return "Healthy"', () => {
      expect(appController.health()).toBe("Healthy")
    })
  })
})

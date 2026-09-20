import { Test, TestingModule } from "@nestjs/testing"
import { describe, beforeEach, it, expect, vi } from "vitest"

import { BooksController } from "./books.controller.js"
import { BooksService } from "./books.service.js"

describe("BooksController", () => {
  let controller: BooksController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        BooksService,
        {
          provide: BooksService,
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

    controller = module.get<BooksController>(BooksController)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })
})

import { ConfigModule } from "@nestjs/config"
import { Test, TestingModule } from "@nestjs/testing"
import { TypeOrmModule } from "@nestjs/typeorm"
import { describe, beforeEach, it, expect, vi } from "vitest"

import { Role } from "./entities/role.entity.js"
import { RolesController } from "./roles.controller.js"
import { RolesService } from "./roles.service.js"

describe("RolesController", () => {
  let controller: RolesController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), TypeOrmModule.forFeature([Role])],
      controllers: [RolesController],
      providers: [
        RolesService,
        {
          provide: RolesService,
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

    controller = module.get<RolesController>(RolesController)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })
})

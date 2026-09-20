import { ConfigModule } from "@nestjs/config"
import { Test, TestingModule } from "@nestjs/testing"
import { TypeOrmModule } from "@nestjs/typeorm"
import { describe, beforeEach, it, expect } from "vitest"

import { testTypeOrmConfig } from "@/test/typeorm-test.config.js"

import { Role } from "./entities/role.entity.js"
import { RolesService } from "./roles.service.js"

describe("RolesService", () => {
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

  it("should be defined", () => {
    expect(service).toBeDefined()
  })
})

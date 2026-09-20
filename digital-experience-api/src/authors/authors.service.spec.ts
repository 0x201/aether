import { ConfigModule } from "@nestjs/config"
import { Test, TestingModule } from "@nestjs/testing"
import { TypeOrmModule } from "@nestjs/typeorm"
import { describe, beforeEach, it, expect } from "vitest"

import { testTypeOrmConfig } from "@/test/typeorm-test.config.js"

import { AuthorsService } from "./authors.service.js"
import { Author } from "./entities/author.entity.js"

describe("AuthorsService", () => {
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

  it("should be defined", () => {
    expect(service).toBeDefined()
  })
})

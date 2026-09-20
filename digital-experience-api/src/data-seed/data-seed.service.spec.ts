import { ConfigModule } from "@nestjs/config"
import { Test, TestingModule } from "@nestjs/testing"
import { TypeOrmModule } from "@nestjs/typeorm"
import { describe, beforeEach, it, expect } from "vitest"

import { Author } from "@/src/authors/entities/author.entity.js"
import { Book } from "@/src/books/entities/book.entity.js"
import { Role } from "@/src/roles/entities/role.entity.js"
import { testTypeOrmConfig } from "@/test/typeorm-test.config.js"

import { DataSeedService } from "./data-seed.service.js"

describe("DataSeedService", () => {
  let service: DataSeedService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync(testTypeOrmConfig),
        TypeOrmModule.forFeature([Role, Author, Book]),
      ],
      providers: [DataSeedService],
    }).compile()

    service = module.get<DataSeedService>(DataSeedService)
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })
})

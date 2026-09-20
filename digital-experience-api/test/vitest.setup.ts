import "reflect-metadata"
import { beforeAll, afterEach, afterAll } from "vitest"

import { testDataSource } from "./environment.js"

beforeAll(async () => {
  if (!testDataSource.isInitialized) {
    await testDataSource.initialize()
  }
})

afterEach(async () => {
  if (testDataSource.isInitialized) {
    const entities = testDataSource.entityMetadatas
    for (const entity of entities) {
      const repository = testDataSource.getRepository(entity.name)
      if (repository) {
        await repository.query(`DELETE FROM ${entity.tableName};`)
      }
    }
  }
})

afterAll(async () => {
  if (testDataSource.isInitialized) {
    await testDataSource.destroy()
  }
})

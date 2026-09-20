import { existsSync, readFileSync } from "fs"
import { resolve } from "path"

import { load } from "js-yaml"
import { DataSource } from "typeorm"

import { AppConfig } from "../config/config.interface.js"

const getEnvironment = (): string => {
  return process.env.NODE_ENV || process.env.TYPEORM_ENV || process.env.APP_ENV || "local"
}

const getEnvFilePath = (): string => {
  const env = getEnvironment()

  const possiblePaths = [
    resolve(__dirname, `../../src/config/${env.toLowerCase()}.yaml`),
    resolve(__dirname, `../../src/config/local.yaml`), // fallback to local
  ]

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path
    }
  }

  return resolve(__dirname, "../../src/config/local.yaml")
}

let config: AppConfig

try {
  const configPath = {
    path: getEnvFilePath(),
  }

  const configFile = readFileSync(configPath.path, "utf8")
  config = load(configFile) as AppConfig
} catch (error) {
  console.error(`Warning: Could not load config file. Using default values. Error: ${error}`)
  throw error
}

const dataSource = new DataSource({
  type: "postgres",
  host: config.database.host,
  port: config.database.port ?? 5432,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  logging: config.database.logging,
  entities: ["/**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/migrations/**/*{.ts,.js}"],
  synchronize: config.database.synchronize,
  schema: config.database.schema,
})

export default dataSource

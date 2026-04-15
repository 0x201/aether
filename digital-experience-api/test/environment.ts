import 'reflect-metadata'
import { DataSource } from 'typeorm'

export const testDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password_here',
  database: process.env.DB_NAME || 'bookstore_test',
  synchronize: true,
  dropSchema: true,
  entities: [__dirname + '/../src/**/*.entity{.ts,.js}', __dirname + '/../src/**/*.dto{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  subscribers: [__dirname + '/subscribers/**/*{.ts,.js}'],
  logging: false,
})

import { config } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';

const envPath = {
  path: resolve(
    __dirname,
    process.env.NODE_ENV === 'Production'
      ? '../../env/.env.production'
      : '../../env/.env.development',
  ),
};

config(envPath);

const dataSource = new DataSource({
  type: 'mssql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) ?? 1433,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  logging: process.env.DB_LOGGING === 'true',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true', // Use this for development purposes
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX_SIZE) || 10,
    min: parseInt(process.env.DB_POOL_MIN_SIZE) || 0,
    idleTimeoutMillis: parseInt(process.env.DB_TIMEOUT) || 30000,
  },
});

console.log(dataSource.options);

export default dataSource;

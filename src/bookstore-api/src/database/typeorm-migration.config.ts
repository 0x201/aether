import { load } from 'js-yaml'; 
import { DataSource } from 'typeorm';
import { AppConfig } from '../config/configuration';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const configPath = {
  path: resolve(
    __dirname,
    process.env.NODE_ENV !== 'Production'
      ? '../../config/development.yaml'
      : '../../config/production.yaml',
  ),
};

const configFile = readFileSync(configPath.path, "utf8");
const config = load(configFile) as AppConfig;



const dataSource = new DataSource({
  type: 'mssql',
  host: config.database.host,
  port: config.database.port ?? 1433,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  logging: config.database.logging,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize:config.database.synchronize,
  options: config.database.options,
  pool: config.database.pool,
});
export default dataSource;

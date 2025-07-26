import * as dotenv from 'dotenv';
import * as path from 'path';
import configuration from '../conifg/configuration';
import { DataSource } from 'typeorm';

dotenv.config({
    path: path.resolve(
        process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
    )
});

const dbConfig = configuration().database;

export default () => new DataSource({
    type: 'mssql',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    logging: dbConfig.logging,
    entities: ['src/**/*.entity{.ts,.js}'],
    migrations: ['src/database/migrations/*{.ts,.js}'],
    synchronize: dbConfig.synchronize,
    options: dbConfig.options,
    pool: dbConfig.pool,
});
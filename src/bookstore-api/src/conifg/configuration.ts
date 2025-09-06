import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
  path: path.resolve(
    process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
  )
});

export default () => ({
  database: {
    type: 'mssql',
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 1433,
    database: process.env.DB_DATABASE,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX_SIZE) || 10,
      min: parseInt(process.env.DB_POOL_MIN_SIZE) || 0,
      idleTimeoutMillis: parseInt(process.env.DB_TIMEOUT) || 30000,
    },
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    },
    logging: process.env.DB_LOGGING === 'true',
    autoLoadEntities: process.env.DB_AUTOLOADENTITIES === 'true' || false,
    entities: ['src/**/*.entity{.ts,.js}'],
    migrations: ['src/database/migrations/*{.ts,.js}'],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  },
  jwtConfig: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_TOKEN_EXPIREIN,
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIREIN,
  },
});

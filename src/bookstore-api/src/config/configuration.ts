import * as path from 'path';
import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { OtelConfig } from './otel.config';

export interface AppConfig {
  database: {
    type: string;
    username: string;
    password: string;
    host: string;
    port: number;
    database: string;
    logging: boolean;
    entities: string[];
    migrations: string[];
    synchronize: boolean;
    pool: {
      max: number;
      min: number;
      idleTimeoutMillis: number;
      createTimeoutMillis: number;
      destroyTimeoutMillis: number;
      acquireTimeoutMillis: number;
    };
    options: {
      encrypt?: boolean,
      trustServerCertificate?: boolean,
    }
  },
  otel: OtelConfig,
  keycloak: {
    realm: string;
    authServerUrl: string;
    clientId: string;
    clientSecret: string;
    scopes: string[];
  };
}

console.log(`ENV: ${process.env.NODE_ENV}`);

const YAML_CONFIG_FILENAME = `${process.env.NODE_ENV}.yaml`;

export default () => {
  const config = yaml.load(
    readFileSync(path.join(__dirname, YAML_CONFIG_FILENAME), "utf8"),
  ) as AppConfig;

  return config;
};
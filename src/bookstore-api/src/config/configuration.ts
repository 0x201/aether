import * as path from 'path';
import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { OtelConfig } from './otel.config';


export interface CacheConfig {
  host: string;
  port: number;
  password: string;
  db: number;
  rejectUnauth: boolean;
  tls: {
    ca: string;
    cert: string;
    key: string;
  }
}

export interface MessagingConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  exchange: string;
  queue: string;
  routingKey: string;
}


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
    schema: string;
    options: {}
  },
  otel: OtelConfig,
  keycloak: {
    realm: string;
    authServerUrl: string;
    clientId: string;
    clientSecret: string;
    scopes: string[];
  };
  cache: CacheConfig,
  messaging: MessagingConfig,
}

console.log(`ENV: ${process.env.NODE_ENV}`);

const YAML_CONFIG_FILENAME = `${process.env.NODE_ENV}.yaml`;

export default () => {
  const config = yaml.load(
    readFileSync(path.join(__dirname, YAML_CONFIG_FILENAME), "utf8"),
  ) as AppConfig;

  return config;
};
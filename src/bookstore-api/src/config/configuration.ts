import { dirname, join, } from 'path';
import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { AppConfig } from './config.interface';

const YAML_CONFIG_FILENAME = `${process.env.NODE_ENV}.yaml`;

function getRedisSslConfig() {
  const sslCertDir = process.env.SSL_CERT_DIR;

  if (!sslCertDir) {
    throw new Error('SSL_CERT_DIR environment variable is not set');
  }
  const sslCertParentPath = dirname(sslCertDir);
  const certPemPath = join(sslCertParentPath, 'cert.pem');
  const sslConfig = {
    ca: certPemPath,
  }
  return sslConfig;
}

export default () => {
  const config = yaml.load(
    readFileSync(join(__dirname, YAML_CONFIG_FILENAME), "utf8"),
  ) as AppConfig;

  const sslConfig = getRedisSslConfig();
  config.cache = {
    ...config.cache,
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    tls: {
      ...config.cache.tls,
      ca: sslConfig.ca,
    }
  }

  config.database = {
    ...config.database,
    host: process.env.BOOKSTOREDB_HOST,
    database: process.env.BOOKSTOREDB_DATABASENAME,
    username: process.env.BOOKSTOREDB_USERNAME,
    password: process.env.BOOKSTOREDB_PASSWORD,
    port: parseInt(process.env.BOOKSTOREDB_PORT),
  }
  
  config.messaging = {
    ...config.messaging,
    host: process.env.EVENTBUS_HOST,
    port: parseInt(process.env.EVENTBUS_PORT),
    username: process.env.EVENTBUS_USERNAME,
    password: process.env.EVENTBUS_PASSWORD,
  }

  config.otel = {
    ...config.otel,
    OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    OTEL_EXPORTER_OTLP_HEADERS: process.env.OTEL_EXPORTER_OTLP_HEADERS,
    OTEL_EXPORTER_OTLP_PROTOCOL: process.env.OTEL_EXPORTER_OTLP_PROTOCOL,
    OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME,
  }

  config.keycloak = {
    ...config.keycloak,
    realm: process.env.KEYCLOAK_REALM || config.keycloak.realm,
    authServerUrl: process.env.KEYCLOAK_HTTP || process.env.KEYCLOAK_HTTPS || config.keycloak.authServerUrl,
    clientId: process.env.KEYCLOAK_CLIENT_ID || config.keycloak.clientId,
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || config.keycloak.clientSecret,
    scopes: config.keycloak.scopes,
  }

  return config;
};
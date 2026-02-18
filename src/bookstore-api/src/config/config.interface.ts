export interface CacheConfig {
    host: string;
    port: number;
    password: string;
    db: number;
    ssl: boolean;
    tls: {
        ca: string;
        rejectUnauth: boolean;
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

export interface KeycloakConfig {
    realm: string;
    authServerUrl: string;
    clientId: string;
    clientSecret: string;
    scopes?: Record<string, string>;
}

export interface OtelConfig {
    OTEL_EXPORTER_OTLP_ENDPOINT: string;
    OTEL_EXPORTER_OTLP_HEADERS: string;
    OTEL_EXPORTER_OTLP_PROTOCOL: string;
    OTEL_SERVICE_NAME: string;
}


export interface AppConfig {
    APP_VERSION: string;
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
    keycloak: KeycloakConfig;
    cache: CacheConfig,
    messaging: MessagingConfig,
}
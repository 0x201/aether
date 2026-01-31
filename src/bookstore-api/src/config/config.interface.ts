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

export interface OtelConfig {
    otelServer: string;
    serviceName: string;
}


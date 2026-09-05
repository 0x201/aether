import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import {
  ConsoleLogger,
  INestApplication,
  Logger,
  NestApplicationOptions,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { apiReference } from "@scalar/nestjs-api-reference";
import { KeycloakConfig } from "./config/config.interface.js";

function useSwaggerModule(app: INestApplication, configService: ConfigService) {
  const openApi = new DocumentBuilder()
    .setTitle("Bookstore Api")
    .setDescription("The bookstore api Scalar UI")
    .setVersion("1.0")
    .addTag("Bookstore-api")
    .addOAuth2()
    .build();

  const document = SwaggerModule.createDocument(app, openApi);
  const keycloakConfig = configService.get<KeycloakConfig>("keycloak")!;

  app.use(
    "/scalar",
    apiReference({
      theme: "kepler",
      showDeveloperTools: "never",
      hideClientButton: true,
      content: document,
      authentication: {
        preferredSecurityScheme: "oauth2AuthorizationCode",
        securitySchemes: {
          oauth2AuthorizationCode: {
            flows: {
              authorizationCode: {
                "x-scalar-client-id": keycloakConfig.clientId,
                clientSecret: keycloakConfig.clientSecret,
                authorizationUrl: `${keycloakConfig.authServerUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/auth`,
                tokenUrl: `${keycloakConfig.authServerUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`,
                scopes: keycloakConfig.scopes,
                "x-usePkce": "no",
              },
            },
          },
        },
      },
    }),
  );
}

async function bootstrap() {
  const appOptions: NestApplicationOptions = {
    logger: new ConsoleLogger({
      logLevels: ["error", "warn", "log", "debug", "verbose"],
      json: true,
      colors: true,
    }),
  };
  const app = await NestFactory.create(AppModule, appOptions);
  const logger = new Logger(app.constructor.name);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT") || 3000;

  app.setGlobalPrefix("/api", { exclude: ["/health"] });
  useSwaggerModule(app, configService);

  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();

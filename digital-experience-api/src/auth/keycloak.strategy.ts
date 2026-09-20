import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import KeycloakConnect from "keycloak-connect"

import { KeycloakConfig } from "./keycloak.config.js"

@Injectable()
export class KeycloakStrategy {
  private readonly logger = new Logger(KeycloakStrategy.name)
  private keycloak: KeycloakConnect.Keycloak
  private readonly keycloakConfig: KeycloakConfig

  constructor(private readonly configService: ConfigService) {
    this.keycloakConfig = {
      realm: this.configService.get<string>("keycloak.realm"),
      "auth-server-url": this.configService.get<string>("keycloak.authServerUrl"),
      resource: this.configService.get<string>("keycloak.clientId"),
      clientId: this.configService.get<string>("keycloak.clientId"),
      clientSecret: this.configService.get<string>("keycloak.clientSecret"),
      "ssl-required": "external",
      "confidential-port": 8080,
    }

    this.keycloak = new KeycloakConnect({}, this.keycloakConfig)

    this.logger.log("Keycloak strategy initialized", this.keycloakConfig)
  }

  getKeycloakInstance(): KeycloakConnect.Keycloak {
    return this.keycloak
  }

  getKeycloakConfig(): KeycloakConfig {
    return this.keycloakConfig
  }
}

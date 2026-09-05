import { Module } from "@nestjs/common";
import { UserContextService } from "./services/user-context.service.js";
import { TelemetryService } from "./services/telemetry.service.js";
import { ConfigModule } from "@nestjs/config";
import { CryptoService } from "./services/crypto.service.js";
import { DateTimeService } from "./services/datetime.service.js";

@Module({
  imports: [ConfigModule],
  providers: [
    UserContextService,
    TelemetryService,
    CryptoService,
    DateTimeService,
  ],
  exports: [
    UserContextService,
    TelemetryService,
    CryptoService,
    DateTimeService,
  ],
})
export class SharedModule {}

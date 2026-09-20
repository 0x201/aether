import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"

import { CryptoService } from "./services/crypto.service.js"
import { DateTimeService } from "./services/datetime.service.js"
import { TelemetryService } from "./services/telemetry.service.js"
import { UserContextService } from "./services/user-context.service.js"

@Module({
  imports: [ConfigModule],
  providers: [UserContextService, TelemetryService, CryptoService, DateTimeService],
  exports: [UserContextService, TelemetryService, CryptoService, DateTimeService],
})
export class SharedModule {}

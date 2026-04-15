import { Module } from '@nestjs/common'
import { UserContextService } from './services/user-context.service'
import { TelemetryService } from './services/telemetry.service'
import { ConfigModule } from '@nestjs/config'
import { CryptoService } from './services/crypto.service'
import { DateTimeService } from './services/datetime.service'

@Module({
  imports: [ConfigModule],
  providers: [UserContextService, TelemetryService, CryptoService, DateTimeService],
  exports: [UserContextService, TelemetryService, CryptoService, DateTimeService],
})
export class SharedModule {}

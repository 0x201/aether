import { Module } from '@nestjs/common';
import { UserContextService } from './services/user-context.service';
import { TracingService } from './services/tracing.service';
import { ConfigModule } from '@nestjs/config';
import { CryptoService } from './services/crypto.service';
import { DateTimeService } from './services/datetime.service';

@Module({
  imports: [ConfigModule],
  providers: [UserContextService, TracingService, CryptoService, DateTimeService],
  exports: [UserContextService, TracingService, CryptoService, DateTimeService],
})
export class SharedModule { }

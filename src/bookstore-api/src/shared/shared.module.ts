import { Module } from '@nestjs/common';
import { UtilsService } from './utils';
import { CurrentUser } from './current-user.service';
import { TracingService } from './tracing.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [UtilsService, CurrentUser, TracingService],
  exports: [UtilsService, CurrentUser, TracingService],
})
export class SharedModule { }
import { Module } from '@nestjs/common';
import { UtilsService } from './utils';
import { CurrentUser } from './current-user.service';

@Module({
  providers: [UtilsService, CurrentUser],
  exports: [UtilsService, CurrentUser],
})
export class SharedModule { }

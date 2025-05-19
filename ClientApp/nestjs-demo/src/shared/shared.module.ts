import { Module } from '@nestjs/common';
import { UtilsService } from './utils';

@Module({
  providers: [UtilsService],
  exports: [UtilsService],
})
export class SharedModule { }

import { Injectable } from '@nestjs/common';
import moment from 'moment';

@Injectable()
export class UtilsService {
  getNowString(): string {
    return moment().format('YYYY-MM-DD HH:mm:ss');
  }
}
import { Injectable } from '@nestjs/common';
import { genSalt, hash } from 'bcrypt';
import moment from 'moment';
import { EncryptionConstants } from './constants/encryption.constant';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UtilsService {
  constructor(private config: ConfigService) {}

  getNowString(format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    return moment().format(format);
  }

  async getPwdHash(plainedPwd: string): Promise<[string, string]> {
    const saltOrRounds =
      this.config.get<number>('saltOrRounds') || EncryptionConstants.saltRound;
    const salt = await genSalt(saltOrRounds);
    const password = await hash(plainedPwd, salt);
    return [password, salt];
  }
}

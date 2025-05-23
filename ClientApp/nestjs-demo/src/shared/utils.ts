import { Injectable } from '@nestjs/common';
import { genSalt, hash } from 'bcrypt';
import * as moment from 'moment';
import { EncryptionConstants } from './constants/encryption.constant';

@Injectable()
export class UtilsService {
  getNowString(): string {
    return moment().format('YYYY-MM-DD HH:mm:ss');
  }

  async getPwdHash(plainedPwd: string): Promise<[string, string]> {
    const salt = await genSalt(EncryptionConstants.saltRound);
    const password = await hash(plainedPwd, salt);
    return [password, salt];
  }
}
import { Injectable } from '@nestjs/common';
import { genSalt, hash } from 'bcrypt';
import moment from 'moment';
import { EncryptionConstants } from './constants/encryption.constant';

@Injectable()
export class UtilsService {
  getNowString(format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    return moment().format(format);
  }

  async getPwdHash(plainedPwd: string): Promise<[string, string]> {
    const salt = await genSalt(EncryptionConstants.saltRound);
    const password = await hash(plainedPwd, salt);
    return [password, salt];
  }
}
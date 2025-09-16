import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { compare, hash } from "bcrypt";

@Injectable()
export class CryptoService {
    constructor(private config: ConfigService) { }

    async compare(plainText: string, hashedText: string): Promise<boolean> {
        return await compare(plainText, hashedText);
    }

    async hash(plainText: string): Promise<string> {
        const saltOrRounds = this.config.get<number>('SaltOrRounds');
        const saltRounds = typeof saltOrRounds === 'string' ? parseInt(saltOrRounds, 10) : saltOrRounds;
        return await hash(plainText, saltRounds);
    }
}
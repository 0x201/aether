import { ConfigService } from "@nestjs/config";
import { config } from "dotenv";
import { DataSource } from "typeorm";

config();

const configService = new ConfigService();

export default new DataSource({
    type: 'mysql',
    host: configService.get<string>('MYSQL_HOST'),
    port: configService.get<number>('MYSQL_PORT') || 3306,
    username: configService.get<string>('MYSQL_USERNAME'),
    password: configService.get<string>('MYSQL_PASSWORD'),
    database: configService.get<string>('MYSQL_DATABASE'),
    logging: configService.get<boolean>('MYSQL_LOGGING'),
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/**/*{.ts,.js}'],
    synchronize: configService.get<boolean>('MYSQL_SYNCHRONIZE'),
    poolSize: configService.get<number>('MYSQL_POOLSIZE') || 5,
});
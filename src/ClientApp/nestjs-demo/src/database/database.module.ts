import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';


@Global()
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'mssql',
                username: configService.get('database.username'),
                host: configService.get('database.host'),
                port: configService.get('database.port'),
                password: configService.get('database.password'),
                database: configService.get('database.database'),
                pool: configService.get('database.pool'),
                options: configService.get('database.options'),
                entities: configService.get('database.entities'),
                migrations: configService.get('database.migrations'),
                synchronize: configService.get('database.synchronize'),
            }),
            name: '',
        }),
    ]
})
export class DatabaseModule { }

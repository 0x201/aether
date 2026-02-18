import { Controller, Get } from '@nestjs/common';
import { AllowAnonymous } from './auth/auth.guard';
import { DataSeedService } from './data-seed/data-seed.service';
import { RedisService } from './cache/redis/redis.service';

@Controller()
export class AppController {
  constructor(private readonly dataSeedService: DataSeedService,
    private readonly cache: RedisService
  ) { }

  @AllowAnonymous()
  @Get('/health')
  health(): string {
    return 'Healthy';
  }

  @AllowAnonymous()
  @Get('/seed-data')
  async seedAsync(): Promise<{}> {
    await this.dataSeedService.seedAsync();
    return { statusCode: 200, message: 'Data seeded successfully' };
  }
}

import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSeedService } from './data-seed/data-seed.service';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(private dataSeedService: DataSeedService) {}

  onApplicationBootstrap() {
    this.dataSeedService.seedAsync();
  }
}

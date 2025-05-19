import { DataSeedService } from './data-seed.service';
import { createMock } from '@golevelup/ts-jest';

describe('DataSeedService', () => {
  let service: DataSeedService;

  beforeEach(async () => {
    service = createMock<DataSeedService>();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

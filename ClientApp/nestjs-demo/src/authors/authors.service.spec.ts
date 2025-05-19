import { AuthorsService } from './authors.service';
import { createMock } from '@golevelup/ts-jest';

describe('AuthorsService', () => {
  let service: AuthorsService;

  beforeEach(async () => {
    service = createMock<AuthorsService>();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

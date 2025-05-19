import { UsersService } from './users.service';
import { createMock } from '@golevelup/ts-jest';

describe('UsersService', () => {
  let service: UsersService = 


  beforeEach(async () => {
    service = createMock<UsersService>();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

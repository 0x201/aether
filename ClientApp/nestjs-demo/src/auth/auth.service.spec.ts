import { AuthService } from './auth.service';
import { createMock } from '@golevelup/ts-jest';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    authService = createMock<AuthService>();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
});

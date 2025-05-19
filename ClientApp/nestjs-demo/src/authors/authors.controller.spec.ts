import { AuthorsController } from './authors.controller';
import { createMock } from '@golevelup/ts-jest';

describe('AuthorsController', () => {
  let controller: AuthorsController;

  beforeEach(async () => {
    controller = createMock<AuthorsController>();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

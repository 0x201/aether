import { BooksController } from './books.controller';
import { createMock } from '@golevelup/ts-jest';

describe('BooksController', () => {
  let controller: BooksController;

  beforeEach(async () => {
    controller = createMock<BooksController>();
  });

  it('should be defined', async () => {
    expect(controller).toBeDefined();
  });
});

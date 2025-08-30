import { BooksService } from './books.service';
import { createMock } from '@golevelup/ts-jest';

describe('BooksService', () => {
  let service: BooksService;

  beforeEach(async () => {
    service = createMock<BooksService>();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { ApiProperty } from '@nestjs/swagger';
import { IListResult } from '../interface/IPagedResult.interface';

class ListResult<T> implements IListResult<T> {
  @ApiProperty()
  readonly items: ReadonlyArray<T>;

  constructor(items: ReadonlyArray<T>) {
    this.items = items;
  }
}

class PagedResult<T> extends ListResult<T> {
  @ApiProperty()
  totalCount: number;

  constructor(items: ReadonlyArray<T>, totalCount: number) {
    super(items);
    this.totalCount = totalCount;
  }
}

export { PagedResult, ListResult };

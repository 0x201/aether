import { ApiProperty } from '@nestjs/swagger';
import { IListResult } from '../interface/IPagedResult.interface';

class ListResultResponse<T> implements IListResult<T> {
  @ApiProperty()
  readonly items: ReadonlyArray<T>;

  constructor(items: ReadonlyArray<T>) {
    this.items = items;
  }
}

class PagedResultResponse<T> extends ListResultResponse<T> {
  @ApiProperty()
  totalCount: number;

  constructor(items: ReadonlyArray<T>, totalCount: number) {
    super(items);
    this.totalCount = totalCount;
  }
}

export { PagedResultResponse, ListResultResponse };

import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';

class LimitedResultQuery {
  @ApiProperty({
    description: 'The count of data per page',
    minimum: 1,
    default: 20,
    type: Number,
  })
  maxResultCount: number = 10;
}

class PagedResultQuery extends OmitType(LimitedResultQuery, []) {
  @ApiProperty({
    description: 'The page index',
    minimum: 0,
    default: 0,
    type: Number,
  })
  skipCount: number = 0;
}

class PagedAndSortedResultQuery extends OmitType(PagedResultQuery, []) {
  @ApiPropertyOptional()
  order: string | null = 'asc';
  @ApiPropertyOptional()
  sorting: string | null = 'id';
}

class PagedSortedAndFilteredResultQuery {
  @ApiProperty({
    description: 'The count of data per page',
    minimum: 1,
    default: 20,
    type: Number,
  })
  maxResultCount: number = 10;
  @ApiPropertyOptional()
  order: string | null = 'asc';
  @ApiPropertyOptional()
  sorting: string | null = 'id';
  @ApiProperty({
    description: 'The page index',
    minimum: 0,
    default: 0,
    type: Number,
  })
  skipCount: number = 0;
  @ApiPropertyOptional()
  filter: string | null;
}

export {
  PagedResultQuery,
  PagedSortedAndFilteredResultQuery,
  PagedAndSortedResultQuery,
};

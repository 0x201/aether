import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger"

class LimitedResultQuery {
  @ApiProperty({
    description: "The count of data per page",
    minimum: 1,
    default: 20,
    type: Number,
  })
  pageSize: number = 10
}

class PagedResultQuery extends OmitType(LimitedResultQuery, []) {
  @ApiProperty({
    description: "The page index",
    minimum: 0,
    default: 0,
    type: Number,
  })
  page: number = 0
}

class PagedAndSortedResultQuery extends OmitType(PagedResultQuery, []) {
  @ApiPropertyOptional()
  order: string | null = "asc"
  @ApiPropertyOptional()
  sorting: string | null = "id"
}

class PagedSortedAndFilteredResultQuery {
  @ApiPropertyOptional()
  filter: string | null
  @ApiProperty({
    description: "The count of data per page",
    minimum: 1,
    default: 20,
    type: Number,
  })
  pageSize: number = 10
  @ApiPropertyOptional()
  order: string | null = "asc"
  @ApiProperty({
    description: "The page index",
    minimum: 1,
    default: 1,
    type: Number,
  })
  page: number = 1
  @ApiPropertyOptional()
  sorting: string | null = "id"
}

export { PagedResultQuery, PagedSortedAndFilteredResultQuery, PagedAndSortedResultQuery }

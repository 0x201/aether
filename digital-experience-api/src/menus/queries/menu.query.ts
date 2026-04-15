import { ApiPropertyOptional } from '@nestjs/swagger'
import { PagedSortedAndFilteredResultQuery } from '@/src/common/queries/PagedResult.query'

export class MenuQuery extends PagedSortedAndFilteredResultQuery {
  @ApiPropertyOptional()
  name: string | null
}

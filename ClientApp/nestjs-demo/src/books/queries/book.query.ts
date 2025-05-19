import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { ITimeRangedQuery } from 'src/common/interface/IPagedResult.interface';
import { PagedSortedAndFilteredResultQuery } from 'src/common/queries/PagedResult.query';

export class BookQuery
  extends PagedSortedAndFilteredResultQuery
  implements ITimeRangedQuery
{
  @ApiPropertyOptional()
  startDate: string | null;
  @ApiPropertyOptional()
  endDate: string | null;
  @ApiPropertyOptional()
  authorId: number | null;
}

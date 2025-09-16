import { ApiPropertyOptional } from '@nestjs/swagger';
import { ITimeRangedQuery } from 'src/common/interface/IPagedResult.interface';
import { PagedSortedAndFilteredResultQuery } from 'src/common/queries/PagedResult.query';

export class UserQuery
  extends PagedSortedAndFilteredResultQuery
  implements ITimeRangedQuery
{
  @ApiPropertyOptional()
  startDate: string;
  @ApiPropertyOptional()
  endDate: string;
  username: string | null;
}

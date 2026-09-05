import { ApiPropertyOptional } from "@nestjs/swagger";
import { ITimeRangedQuery } from "@/src/common/interface/IPagedResult.interface.js";
import { PagedSortedAndFilteredResultQuery } from "@/src/common/queries/PagedResult.query.js";

export class GetBooksQuery
  extends PagedSortedAndFilteredResultQuery
  implements ITimeRangedQuery
{
  @ApiPropertyOptional()
  startDate: string;
  @ApiPropertyOptional()
  endDate: string;
  @ApiPropertyOptional()
  authorId: number | null;
}

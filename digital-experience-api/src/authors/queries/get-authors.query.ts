import { IsOptional, IsString } from "class-validator";
import { PagedSortedAndFilteredResultQuery } from "../../common/queries/PagedResult.query.js";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class GetAuthorsQuery extends PagedSortedAndFilteredResultQuery {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;
}

import { IResult } from "../response/Result.js"

interface IFilteredResultQuery {
  filter: string | null
}

interface IHasTotalCount {
  totalCount: number
}

interface ILimitedResultQuery {
  pageSize: number
}

interface IListResult<T> extends IResult<ReadonlyArray<T>> {}

interface IPagedAndSortedResultQuery
  extends IPagedResultQuery, ILimitedResultQuery, ISortedResultQuery {}

interface IPagedResultQuery extends ILimitedResultQuery {
  page: number
}

interface ISortedResultQuery {
  sorting: string | null
  order: string | null
}

interface ITimeRangedQuery {
  startDate: string
  endDate: string
}

interface IPagedResult<T> extends IListResult<T>, IHasTotalCount {}

export type {
  IFilteredResultQuery,
  IHasTotalCount,
  ILimitedResultQuery,
  IListResult,
  IPagedAndSortedResultQuery,
  IPagedResultQuery,
  ISortedResultQuery,
  ITimeRangedQuery,
  IPagedResult,
}

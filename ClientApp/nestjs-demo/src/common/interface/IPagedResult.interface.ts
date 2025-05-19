interface IAuditable {
  createdTime: string;
  createdBy: string;
  lastModifiedTime: string;
  lastModifiedBy: string;
}

interface IFilteredResultQuery {
  filter: string | null;
}

interface IHasTotalCount {
  totalCount: number;
}

interface ILimitedResultQuery {
  maxResultCount: number;
}

interface IListResult<T> {
  readonly items: ReadonlyArray<T>;
}

interface IPagedAndSortedResultQuery
  extends IPagedResultQuery,
    ILimitedResultQuery,
    ISortedResultQuery {}

interface IPagedResultQuery extends ILimitedResultQuery {
  skipCount: number;
}

interface ISortedResultQuery {
  sorting: string | null;
  order: string | null;
}

interface ITimeRangedQuery {
  startDate: string;
  endDate: string;
}

interface IPagedResult<T> extends IListResult<T>, IHasTotalCount {}

export {
  IAuditable,
  IFilteredResultQuery,
  IHasTotalCount,
  ILimitedResultQuery,
  IListResult,
  IPagedAndSortedResultQuery,
  IPagedResultQuery,
  ISortedResultQuery,
  ITimeRangedQuery,
  IPagedResult,
};

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export interface PagedQuery {
  page: number;
  pageSize: number;
  filter?: string;
  sorting?: string;
}
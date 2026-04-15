import { Result } from "./result.mpdel";

export interface PagedResult<T> extends Result {
  data: T[];
  totalCount: number;
}

export interface PagedQuery {
  page: number;
  pageSize: number;
  filter?: string;
  sorting?: string;
}
export interface PaginationData<T> {
    data: T[];
    total: number;
    page: number;
}

export interface SortedRequest {
    sorter?: string;
}

export interface TimeRangeRequest {
    startTime?: string;
    endTime?: string;
}
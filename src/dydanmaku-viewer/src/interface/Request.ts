export interface PaginationRequest {
    page: number
    pageSize: number
}

export interface SortedRequest {
    sorter?: string
}

export interface TimeRangeRequest {
    startTime?: string
    endTime?: string
}

export interface Response {
    status: number;
    message: string;
}

export interface DataResponse<T> extends Response {
    data: T;
}

export interface PaginationResponse<T> extends Response {
    data: T[];
    total: number;
}
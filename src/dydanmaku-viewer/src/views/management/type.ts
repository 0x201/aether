import type { SortedRequest, TimeRangeRequest } from "@/src/interface/PaginationData";

export interface DanmakuSearchParams extends SortedRequest, TimeRangeRequest {
    userName?: string;
    content?: string;
    roomId?: string;
}

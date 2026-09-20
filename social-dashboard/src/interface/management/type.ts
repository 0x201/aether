import type {
  PaginationRequest,
  SortedRequest,
  TimeRangeRequest,
} from "@/src/interface/shared/type"

export interface DanmakuSearchParams extends PaginationRequest, SortedRequest, TimeRangeRequest {
  userName?: string
  content?: string
  roomId?: string
}

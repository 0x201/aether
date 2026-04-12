import type { PaginationRequest, SortedRequest, TimeRangeRequest } from '@/src/interface/Request'

export interface DanmakuSearchParams extends PaginationRequest, SortedRequest, TimeRangeRequest {
  userName?: string
  content?: string
  roomId?: string
}

import type { PaginationRequest, SortedRequest, TimeRangeRequest } from '@/src/interface/Request'
import type { DataResponse } from '@/src/interface/Response'

export interface CaptureJob {
  id: number
  roomId: number
  status: string
  duration: number
  startTime: string
  endTime: string | null
  createdAt: string
  roomName: string
}

export interface StartCaptureRequest {
  roomId: number
  duration: number
}

export interface StartCaptureRes {
  roomId: number
  anchorName: string
}

export type StartCaptureResponse = DataResponse<StartCaptureRes>

export interface StopCaptureRequest {
  roomId: number
}

export interface CaptureSearchParams extends PaginationRequest, SortedRequest, TimeRangeRequest {
  roomId?: string
  status?: string
}

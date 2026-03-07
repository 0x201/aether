import type { DataResponse, PaginationResponse } from '@/src/interface/Response'

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

export type CaptureJobPagedResponse = PaginationResponse<CaptureJob>

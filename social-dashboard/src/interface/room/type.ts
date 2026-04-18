import type {
  PaginationRequest,
  SortedRequest,
  TimeRangeRequest,
  PaginationResponse,
} from '@/src/interface/shared/type'

export interface Room {
  id: number
  roomId: number
  roomName: string
  createdAt: string
}

export interface RoomOption {
  label: string
  value: string
}

export interface RoomListResponse extends PaginationResponse<Room> {
  data: Room[]
  total: number
}

export interface RoomSearchParams extends PaginationRequest, SortedRequest, TimeRangeRequest {
  roomName?: string
  roomId?: string
  sorter?: string
}

export interface CreateRoomRequest {
  roomName: string
  roomId: string
}

export interface UpdateRoomRequest {
  roomName?: string
  roomId?: string
}

import config from '@/src/config'
import type {
  CreateRoomRequest,
  Room,
  RoomSearchParams,
  UpdateRoomRequest,
} from '@/src/interface/room/type'
import type { PaginationResponse } from '@/src/interface/shared/type'

const { apiVersion } = config
const baseUrl = `/api/${apiVersion}/danmakus/rooms`

export interface RoomService {
  fetchRoomList: (searchParams: RoomSearchParams | null) => Promise<PaginationResponse<Room>>
  getRoomById: (id: number) => Promise<Room | null>
  createRoom: (request: CreateRoomRequest) => Promise<boolean>
  updateRoom: (id: number, request: UpdateRoomRequest) => Promise<boolean>
  deleteRoom: (id: number) => Promise<boolean>
}

export const createRoomService = (): RoomService => {
  return {
    fetchRoomList: async (searchParams: RoomSearchParams | null) => {
      const queryParams = new URLSearchParams()

      if (searchParams) {
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== '' && value !== undefined && value !== null) {
            queryParams.append(key, value.toString())
          }
        })
      }

      const endpoint = `${baseUrl}?${queryParams.toString()}`
      const response = await fetch(endpoint)

      if (!response.ok) {
        throw new Error(`获取房间列表失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    },

    getRoomById: async (id: number): Promise<Room | null> => {
      const endpoint = `${baseUrl}/${id}`
      const response = await fetch(endpoint)

      if (!response.ok) {
        throw new Error(`获取房间失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    },

    createRoom: async (request: CreateRoomRequest): Promise<boolean> => {
      const endpoint = `${baseUrl}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`创建房间失败: ${response.status} ${response.statusText}`)
      }
      return true
    },

    updateRoom: async (id: number, request: UpdateRoomRequest): Promise<boolean> => {
      const endpoint = `${baseUrl}/${id}`
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`更新房间失败: ${response.status} ${response.statusText}`)
      }

      return true
    },

    deleteRoom: async (id: number): Promise<boolean> => {
      const endpoint = `${baseUrl}/${id}`
      const response = await fetch(endpoint, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`删除房间失败: ${response.status} ${response.statusText}`)
      }

      return true
    },
  }
}

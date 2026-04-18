import config from '@/src/config'
import type { MessageInstance } from 'antd/es/message/interface'
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

export const createRoomService = (messageApi: MessageInstance): RoomService => {
  return {
    fetchRoomList: async (searchParams: RoomSearchParams | null) => {
      try {
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
      } catch (error) {
        console.error('Failed to fetch room list:', error)
        messageApi.error('获取房间列表失败')
        throw error
      }
    },

    getRoomById: async (id: number): Promise<Room | null> => {
      try {
        const endpoint = `${baseUrl}/${id}`
        const response = await fetch(endpoint)

        if (!response.ok) {
          throw new Error(`获取房间失败: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } catch (error) {
        console.error(`Failed to fetch room with id ${id}:`, error)
        messageApi.error('获取房间失败')
        return null
      }
    },

    createRoom: async (request: CreateRoomRequest): Promise<boolean> => {
      try {
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

        messageApi.success('房间创建成功')
        return true
      } catch (error) {
        console.error('Failed to create room:', error)
        messageApi.error('创建房间失败')
        return false
      }
    },

    updateRoom: async (id: number, request: UpdateRoomRequest): Promise<boolean> => {
      try {
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

        messageApi.success('房间更新成功')
        return true
      } catch (error) {
        console.error(`Failed to update room with id ${id}:`, error)
        messageApi.error('更新房间失败')
        return false
      }
    },

    deleteRoom: async (id: number): Promise<boolean> => {
      try {
        const endpoint = `${baseUrl}/${id}`
        const response = await fetch(endpoint, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error(`删除房间失败: ${response.status} ${response.statusText}`)
        }

        messageApi.success('房间删除成功')
        return true
      } catch (error) {
        console.error(`Failed to delete room with id ${id}:`, error)
        messageApi.error('删除房间失败')
        return false
      }
    },
  }
}

import config from '@/src/config'
import type {
  CaptureJob,
  CaptureSearchParams,
  StartCaptureRequest,
  StartCaptureResponse,
  StopCaptureRequest,
} from '@/src/interface/capture/type'
import type { Room } from '@/src/interface/room/type'
import type { MessageInstance } from 'antd/es/message/interface'
import type { PaginationResponse } from '@/src/interface/shared/type'

const { apiVersion } = config
const baseUrl = `/api/${apiVersion}/danmakus`

export interface CaptureService {
  fetchJobs: (searchParams: CaptureSearchParams | null) => Promise<PaginationResponse<CaptureJob>>
  fetchRooms: (page: number, pageSize: number, search?: string) => Promise<PaginationResponse<Room>>
  startCapture: (request: StartCaptureRequest) => Promise<StartCaptureResponse>
  stopCapture: (request: StopCaptureRequest) => Promise<void>
}

export const createCaptureService = (messageApi: MessageInstance): CaptureService => {
  return {
    fetchJobs: async (searchParams: CaptureSearchParams | null) => {
      try {
        const queryParams = new URLSearchParams()

        if (searchParams) {
          Object.entries(searchParams).forEach(([key, value]) => {
            if (value !== '' && value !== undefined && value !== null) {
              queryParams.append(key, value.toString())
            }
          })
        }

        const endpoint = `${baseUrl}/capture/jobs?${queryParams.toString()}`
        const response = await fetch(endpoint)

        if (!response.ok) {
          throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } catch (error) {
        console.error('An error occurred while fetching task list:', error)
        messageApi.error('获取任务列表时发生错误')
        throw error
      }
    },

    fetchRooms: async (
      page: number,
      pageSize: number,
      search?: string,
    ): Promise<PaginationResponse<Room>> => {
      try {
        const queryParams = new URLSearchParams()
        queryParams.append('page', page.toString())
        queryParams.append('pageSize', pageSize.toString())
        queryParams.append('sorter', 'id asc')

        if (search) {
          queryParams.append('search', search)
        }

        const endpoint = `${baseUrl}/rooms?${queryParams.toString()}`
        const response = await fetch(endpoint)

        if (!response.ok) {
          throw new Error(`获取房间列表失败: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } catch (error) {
        console.error('Failed to fetch rooms:', error)
        messageApi.error('获取房间列表失败')
        throw error
      }
    },

    startCapture: async (request: StartCaptureRequest): Promise<StartCaptureResponse> => {
      try {
        const response = await fetch(`${baseUrl}/capture/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          const errorData = await response.json()
          messageApi.error(errorData.detail || '启动捕获任务失败')
          throw new Error(errorData.detail || 'Failed to start capture')
        }

        const result: StartCaptureResponse = await response.json()
        messageApi.success(`捕获任务已启动，房间ID: ${result.data.roomId}`)
        return result
      } catch (error) {
        console.error('启动捕获任务时发生错误:', error)
        messageApi.error('启动捕获任务时发生错误')
        throw error
      }
    },

    stopCapture: async (request: StopCaptureRequest): Promise<void> => {
      try {
        const response = await fetch(`${baseUrl}/capture/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          const errorData = await response.json()
          messageApi.error(errorData.detail || '停止捕获任务失败')
          throw new Error(errorData.detail || 'Failed to stop capture')
        }

        messageApi.success('停止捕获任务成功')
      } catch (error) {
        console.error('停止捕获任务时发生错误:', error)
        messageApi.error('停止捕获任务时发生错误')
        throw error
      }
    },
  }
}

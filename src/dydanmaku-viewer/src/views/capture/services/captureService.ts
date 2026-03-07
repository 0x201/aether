import config from '@/src/config'
import type {
    CaptureJobPagedResponse,
    StartCaptureRequest,
    StartCaptureResponse,
    StopCaptureRequest,
} from '../type'
import type { Room } from '@/src/interface/Danmaku'
import type { MessageInstance } from 'antd/es/message/interface'

const { apiVersion } = config
const captureEndpoint = `/api/${apiVersion}/danmakus/capture`
const roomEndpoint = `/api/${apiVersion}/danmakus/rooms`

export interface CaptureService {
    fetchJobs: (
        page: number,
        pageSize: number,
        sorter: string | null,
    ) => Promise<CaptureJobPagedResponse>
    fetchRooms: () => Promise<Room[]>
    startCapture: (
        request: StartCaptureRequest,
    ) => Promise<StartCaptureResponse>
    stopCapture: (request: StopCaptureRequest) => Promise<void>
}

export const createCaptureService = (
    messageApi: MessageInstance,
): CaptureService => {
    return {
        fetchJobs: async (
            page: number,
            pageSize: number,
            sorter: string | null,
        ) => {
            const queryParams = new URLSearchParams()
            queryParams.append('page', page.toString())
            queryParams.append('pageSize', pageSize.toString())

            if (sorter) {
                queryParams.append('sorter', sorter)
            }

            try {
                const endpoint = `${captureEndpoint}/jobs?${queryParams.toString()}`
                const response = await fetch(endpoint)

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch jobs: ${response.status} ${response.statusText}`,
                    )
                }

                const data: CaptureJobPagedResponse = await response.json()
                return data
            } catch (error) {
                console.error(
                    'An error occurred while fetching task list:',
                    error,
                )
                messageApi.error('获取任务列表时发生错误')
                throw error
            }
        },

        fetchRooms: async (): Promise<Room[]> => {
            try {
                const response = await fetch(
                    `${roomEndpoint}?page=1&pageSize=100&sorter=id asc`,
                )

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch rooms: ${response.status} ${response.statusText}`,
                    )
                }

                const data = await response.json()
                return data.data
            } catch (error) {
                console.error('获取房间列表时发生错误:', error)
                messageApi.error('获取房间列表失败')
                throw error
            }
        },

        startCapture: async (
            request: StartCaptureRequest,
        ): Promise<StartCaptureResponse> => {
            try {
                const response = await fetch(`${captureEndpoint}/start`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(request),
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    messageApi.error(errorData.detail || '启动捕获任务失败')
                    throw new Error(
                        errorData.detail || 'Failed to start capture',
                    )
                }

                const result: StartCaptureResponse = await response.json()
                messageApi.success(
                    `捕获任务已启动，房间ID: ${result.data.roomId}`,
                )
                return result
            } catch (error) {
                console.error('启动捕获任务时发生错误:', error)
                messageApi.error('启动捕获任务时发生错误')
                throw error
            }
        },

        stopCapture: async (request: StopCaptureRequest): Promise<void> => {
            try {
                const response = await fetch(`${captureEndpoint}/stop`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(request),
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    messageApi.error(errorData.detail || '停止捕获任务失败')
                    throw new Error(
                        errorData.detail || 'Failed to stop capture',
                    )
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

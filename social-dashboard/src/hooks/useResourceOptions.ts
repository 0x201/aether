import { useState, useCallback, useMemo } from 'react'
import type { MessageInstance } from 'antd/es/message/interface'
import type { Room, RoomOption } from '@/src/interface/room/type'
import { createRoomService } from '@/src/services/roomService'

interface ResourceOption {
  label: string
  value: string
}

interface RoomSearchParams {
  page: number
  pageSize: number
  roomName?: string
}

interface UseResourceOptionsProps<T = ResourceOption> {
  messageApi: MessageInstance
  fetchFunction: (
    page: number,
    pageSize: number,
    search?: string,
  ) => Promise<{ data: any[]; total: number }>
  mapToOption: (item: any) => T
}

export const useResourceOptions = <T = ResourceOption>({
  messageApi,
  fetchFunction,
  mapToOption,
}: UseResourceOptionsProps<T>) => {
  const [loading, setLoading] = useState(false)

  const fetchOptions = useCallback(
    async (
      page: number = 1,
      pageSize: number = 10,
      search?: string,
    ): Promise<{ data: T[]; total: number }> => {
      setLoading(true)
      try {
        const response = await fetchFunction(page, pageSize, search)

        return {
          data: response.data.map(mapToOption),
          total: response.total,
        }
      } catch (error) {
        console.error('Failed to fetch options:', error)
        messageApi.error('获取选项失败')
        return {
          data: [],
          total: 0,
        }
      } finally {
        setLoading(false)
      }
    },
    [fetchFunction, mapToOption, messageApi],
  )

  return {
    loading,
    fetchOptions,
  }
}

export const useRoomOptions = (messageApi: MessageInstance) => {
  const roomService = useMemo(() => createRoomService(messageApi), [messageApi])

  return useResourceOptions<RoomOption>({
    messageApi,
    fetchFunction: async (page, pageSize, search) => {
      const searchParams: RoomSearchParams = {
        page,
        pageSize,
        roomName: search || undefined,
      }
      const response = await roomService.fetchRoomList(searchParams)

      return {
        data: response.data,
        total: response.total,
      }
    },
    mapToOption: (room: Room) => ({
      label: `${room.roomName} (房间ID: ${room.roomId})`,
      value: room.roomId.toString(),
    }),
  })
}

import { useCallback, useMemo, useRef, useEffect } from 'react'
import type { MessageInstance } from 'antd/es/message/interface'
import type { Room, RoomOption, RoomSearchParams } from '@/src/interface/room/type'
import { createRoomService } from '@/src/services/roomService'

interface ResourceOption {
  label: string
  value: string
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
  const errorRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchOptions = useCallback(
    async (
      page: number = 1,
      pageSize: number = 20,
      search?: string,
    ): Promise<{ data: T[]; total: number }> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      if (errorRef.current) {
        return { data: [], total: 0 }
      }
      try {
        const response = await fetchFunction(page, pageSize, search)
        errorRef.current = false
        return {
          data: response.data.map(mapToOption),
          total: response.total,
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return { data: [], total: 0 }
        }
        console.error('Failed to fetch options:', error)
        if (!errorRef.current) {
          messageApi.error('获取选项失败，请检查后端服务是否正常')
          errorRef.current = true
        }
        return {
          data: [],
          total: 0,
        }
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null
        }
      }
    },
    [fetchFunction, mapToOption, messageApi],
  )

  const resetError = useCallback(() => {
    errorRef.current = false
  }, [])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    fetchOptions,
    resetError,
  }
}

export const useRoomOptions = (messageApi: MessageInstance) => {
  const roomService = useMemo(() => createRoomService(), [])

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

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { message } from 'antd'
import type { MessageInstance } from 'antd/es/message/interface'
import type {
  CreateRoomRequest,
  Room,
  RoomSearchParams,
  UpdateRoomRequest,
} from '@/src/interface/room/type'
import { createRoomService } from '@/src/services/roomService'
import { useRoomOptions } from './useResourceOptions'

interface UseRoomMgtProps {
  messageApi?: MessageInstance
}

export const useRoomMgt = ({ messageApi }: UseRoomMgtProps) => {
  const [roomList, setRoomList] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorter, setSorter] = useState<string | null>(null)
  const errorFlagRef = useRef<boolean>(false)

  const [searchParams, setSearchParams] = useState<RoomSearchParams>({
    page: 1,
    pageSize: 10,
    roomName: '',
    roomId: '',
  })

  const service = useMemo(() => createRoomService(messageApi || message), [messageApi])

  const { fetchOptions: fetchRoomOptions } = useRoomOptions(messageApi || message)

  const loadRoomList = useCallback(async () => {
    if (errorFlagRef.current) return

    setLoading(true)
    try {
      const params = {
        ...searchParams,
        page: currentPage,
        pageSize: pageSize,
        ...(sorter ? { sorter } : {}),
      }

      const data = await service.fetchRoomList(params)
      setRoomList(data.data)
      setTotal(data.total)
      errorFlagRef.current = false
    } catch (error) {
      console.error('Failed to fetch room list:', error)
      if (!errorFlagRef.current) {
        messageApi?.error('获取房间列表失败，请检查后端服务是否正常')
        errorFlagRef.current = true
      }
    } finally {
      setLoading(false)
    }
  }, [service, currentPage, pageSize, sorter, searchParams, messageApi])

  useEffect(() => {
    loadRoomList()
  }, [loadRoomList])

  const handlePageChange = useCallback(
    (page: number, limit?: number) => {
      setCurrentPage(page)
      if (limit && limit !== pageSize) {
        setPageSize(limit)
      }
      errorFlagRef.current = false
    },
    [pageSize],
  )

  const handleSearch = useCallback(
    (newSearchParams: RoomSearchParams) => {
      setSearchParams(newSearchParams)
      setCurrentPage(1)
      errorFlagRef.current = false
    },
    [setSearchParams],
  )

  const handleResetSearch = useCallback(() => {
    setSearchParams({
      page: 1,
      pageSize: 10,
      roomName: undefined,
      roomId: undefined,
    })
    setCurrentPage(1)
    errorFlagRef.current = false
  }, [setSearchParams])

  const handleDelete = useCallback(
    async (id: number) => {
      const success = await service.deleteRoom(id)
      if (success) {
        errorFlagRef.current = false
        loadRoomList()
      }
      return success
    },
    [service, loadRoomList],
  )

  const handleUpdate = useCallback(
    async (id: number, data: UpdateRoomRequest) => {
      const success = await service.updateRoom(id, data)
      if (success) {
        errorFlagRef.current = false
        loadRoomList()
      }
      return success
    },
    [service, loadRoomList],
  )

  const handleCreate = useCallback(
    async (data: CreateRoomRequest) => {
      const success = await service.createRoom(data)
      if (success) {
        errorFlagRef.current = false
        loadRoomList()
      }
      return success
    },
    [service, loadRoomList],
  )

  return {
    state: {
      roomList,
      loading,
      editingRoom,
      isModalVisible,
      total,
      currentPage,
      pageSize,
      sorter,
      searchParams,
    },
    actions: {
      loadRoomList,
      handlePageChange,
      handleSearch,
      handleResetSearch,
      handleDelete,
      handleUpdate,
      handleCreate,
      setEditingRoom,
      setIsModalVisible,
      setSorter,
      fetchRoomOptions,
    },
  }
}

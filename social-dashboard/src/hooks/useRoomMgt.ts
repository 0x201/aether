import { useState, useCallback, useEffect, useMemo } from 'react'
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

  const [searchParams, setSearchParams] = useState<RoomSearchParams>({
    page: 1,
    pageSize: 10,
    roomName: '',
    roomId: '',
  })

  const service = useMemo(() => createRoomService(messageApi || message), [messageApi])

  // 使用通用的房间选项获取功能
  const { fetchOptions: fetchRoomOptions } = useRoomOptions(messageApi || message)

  const loadRoomList = useCallback(async () => {
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
    } catch (error) {
      console.error('Failed to fetch room list:', error)
      messageApi?.error('获取房间列表失败')
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
    },
    [pageSize],
  )

  const handleSearch = useCallback(
    (newSearchParams: RoomSearchParams) => {
      setSearchParams(newSearchParams)
      setCurrentPage(1)
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
  }, [setSearchParams])

  const handleDelete = useCallback(
    async (id: number) => {
      const success = await service.deleteRoom(id)
      if (success) {
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

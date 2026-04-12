import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Danmaku, RoomOption } from '@/src/interface/Danmaku'
import type { DanmakuSearchParams } from '../type'
import { createDanmakuService } from '../services/danmakuService'
import type { MessageInstance } from 'antd/es/message/interface'
import type { Room } from '@/src/interface/Danmaku'

interface UseDanmakuManagementProps {
  messageApi: MessageInstance
}

export const useDanmakuManagement = ({ messageApi }: UseDanmakuManagementProps) => {
  const [danmakuList, setDanmakuList] = useState<Danmaku[]>([])
  const [loading, setLoading] = useState(false)
  const [editingDanmaku, setEditingDanmaku] = useState<Danmaku | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorter, setSorter] = useState<string | null>(null)

  const [searchParams, setSearchParams] = useState<DanmakuSearchParams>({
    page: 1,
    pageSize: 10,
    userName: '',
    content: '',
    roomId: '',
  })

  const service = useMemo(() => createDanmakuService(messageApi), [messageApi])

  const medalLevelColors = useMemo(
    () => ({
      0: 'var(--fan-medal-0-level)',
      1: 'var(--fan-medal-1-level)',
      2: 'var(--fan-medal-2-level)',
      3: 'var(--fan-medal-3-level)',
      4: 'var(--fan-medal-4-level)',
      5: 'var(--fan-medal-5-level)',
    }),
    [],
  )

  const userLevelColors = useMemo(
    () => ({
      0: 'var(--user-level-0)',
      1: 'var(--user-level-1)',
      2: 'var(--user-level-2)',
      3: 'var(--user-level-3)',
      4: 'var(--user-level-4)',
      5: 'var(--user-level-5)',
      6: 'var(--user-level-6)',
    }),
    [],
  )

  const fetchRoomOptions = useCallback(
    async (
      page: number = 1,
      pageSize: number = 10,
      search?: string,
    ): Promise<{ data: RoomOption[]; total: number }> => {
      try {
        const response = await service.fetchRooms(page, pageSize, search)

        return {
          data: response.data.map((room: Room) => ({
            label: `${room.anchorName} (房间ID: ${room.roomId})`,
            value: room.roomId.toString(),
          })),
          total: response.total,
        }
      } catch (error) {
        console.error('Failed to fetch rooms:', error)
        messageApi.error('获取房间列表失败')
        return {
          data: [],
          total: 0,
        }
      }
    },
    [service, messageApi],
  )

  const loadDanmakuList = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        ...searchParams,
        page: currentPage,
        pageSize: pageSize,
        ...(sorter ? { sorter } : {}),
      }

      const data = await service.fetchDanmakuList(params)
      setDanmakuList(data.data)
      setTotal(data.total)
    } catch (error) {
      console.error('Failed to fetch danmaku list:', error)
      messageApi.error('获取弹幕列表失败')
    } finally {
      setLoading(false)
    }
  }, [service, currentPage, pageSize, sorter, searchParams])

  useEffect(() => {
    loadDanmakuList()
  }, [loadDanmakuList])

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
    (newSearchParams: DanmakuSearchParams) => {
      setSearchParams(newSearchParams)
      setCurrentPage(1)
    },
    [setSearchParams],
  )

  const handleResetSearch = useCallback(() => {
    setSearchParams({
      page: 1,
      pageSize: 10,
      userName: undefined,
      content: undefined,
      roomId: undefined,
      startTime: undefined,
      endTime: undefined,
    })
    setCurrentPage(1)
  }, [setSearchParams])

  const handleDelete = useCallback(
    async (id: string) => {
      const success = await service.deleteDanmaku(id)
      if (success) {
        loadDanmakuList()
      }
      return success
    },
    [service, loadDanmakuList],
  )

  const handleUpdate = useCallback(
    async (id: string, data: Partial<Danmaku>) => {
      const success = await service.updateDanmaku(id, data)
      if (success) {
        loadDanmakuList()
      }
      return success
    },
    [service, loadDanmakuList],
  )

  return {
    state: {
      danmakuList,
      loading,
      editingDanmaku,
      isModalVisible,
      total,
      currentPage,
      pageSize,
      sorter,
      searchParams,
      medalLevelColors,
      userLevelColors,
    },
    actions: {
      loadDanmakuList,
      handlePageChange,
      handleSearch,
      handleResetSearch,
      handleDelete,
      handleUpdate,
      setEditingDanmaku,
      setIsModalVisible,
      setSorter,
      fetchRoomOptions,
    },
  }
}

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { CaptureJob, CaptureSearchParams } from '../type'
import type { Room, RoomOption } from '@/src/interface/Danmaku'
import { createCaptureService } from '../services/captureService'
import type { MessageInstance } from 'antd/es/message/interface'

interface UseCaptureManagementProps {
  messageApi: MessageInstance
}

export const useCaptureManagement = ({ messageApi }: UseCaptureManagementProps) => {
  const [jobList, setJobList] = useState<CaptureJob[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [total, setTotal] = useState<number>(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorter, setSorter] = useState<string | null>(null)
  const [captureStartRes, setCaptureStartRes] = useState<string>('')
  const [isCaptureSuccess, setIsCaptureSuccess] = useState<boolean>(false)
  const [searchParams, setSearchParams] = useState<CaptureSearchParams>({
    page: 1,
    pageSize: 10,
    status: '',
    roomId: '',
  })
  const service = useMemo(() => createCaptureService(messageApi), [messageApi])

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        ...searchParams,
        page: currentPage,
        pageSize: pageSize,
        ...(sorter ? { sorter: sorter } : {}),
      }
      const data = await service.fetchJobs(params)
      setJobList(data.data)
      setTotal(data.total)
    } catch (error) {
      console.error('获取任务列表失败:', error)
      messageApi.error('获取任务列表失败')
    } finally {
      setLoading(false)
    }
  }, [service, currentPage, pageSize, sorter, searchParams])

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

  const startCapture = useCallback(
    async (roomId: string, duration: number) => {
      if (!roomId) {
        messageApi.error('请输入房间ID')
        return
      }

      try {
        const result = await service.startCapture({
          roomId: Number(roomId),
          duration,
        })

        setCaptureStartRes(`开始捕获直播间 -> 主播: ${result.data.anchorName}`)
        setIsCaptureSuccess(true)
        await fetchJobs()
      } catch (error) {
        console.error('启动捕获任务失败:', error)
      }
    },
    [service, messageApi, fetchJobs],
  )

  const stopCapture = useCallback(
    async (roomId: number) => {
      try {
        await service.stopCapture({ roomId })
        await fetchJobs()
      } catch (error) {
        console.error('停止捕获任务失败:', error)
      }
    },
    [service, fetchJobs],
  )

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
    (newSearchParams: CaptureSearchParams) => {
      setSearchParams(newSearchParams)
      setCurrentPage(1)
    },
    [setSearchParams],
  )

  const handleResetSearch = useCallback(() => {
    setSearchParams({
      page: 1,
      pageSize: 10,
      status: undefined,
      roomId: undefined,
      startTime: undefined,
      endTime: undefined,
    })
    setCurrentPage(1)
  }, [setSearchParams])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs, fetchRoomOptions])

  return {
    state: {
      jobList,
      loading,
      currentPage,
      total,
      pageSize,
      sorter,
      searchParams,
      captureStartRes,
      isCaptureSuccess,
    },
    actions: {
      fetchJobs,
      fetchRoomOptions,
      startCapture,
      stopCapture,
      handlePageChange,
      handleSearch,
      handleResetSearch,
      setSorter,
      setIsCaptureSuccess,
    },
  }
}

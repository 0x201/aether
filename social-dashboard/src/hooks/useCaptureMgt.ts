import { useState, useEffect, useCallback, useMemo } from 'react'
import type { CaptureJob, CaptureSearchParams } from '@/src/interface/capture/type'
import { createCaptureService } from '@/src/services/captureService'
import type { MessageInstance } from 'antd/es/message/interface'
import { useRoomOptions } from './useResourceOptions'

interface UseCaptureMgtProps {
  messageApi: MessageInstance
}

export const useCaptureMgt = ({ messageApi }: UseCaptureMgtProps) => {
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

  const { fetchOptions: fetchRoomOptions } = useRoomOptions(messageApi)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        ...searchParams,
        page: currentPage,
        pageSize: pageSize,
        ...(sorter ? { sorter: sorter } : {}),
      }
      const response = await service.fetchJobs(params)
      setJobList(response.data)
      setTotal(response.total)
    } catch (error) {
      console.error('获取任务列表失败:', error)
      messageApi.error('获取任务列表失败')
    } finally {
      setLoading(false)
    }
  }, [service, currentPage, pageSize, sorter, searchParams])

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

        setCaptureStartRes(`开始捕获直播间 -> 主播: ${result.data.roomName}`)
        setIsCaptureSuccess(true)
        await fetchJobs()
      } catch (error) {
        console.error('启动捕获任务失败:', error)
        messageApi.error('启动捕获任务失败')
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
  }, [fetchJobs])

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

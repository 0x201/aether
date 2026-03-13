import { useState, useEffect, useCallback, useRef } from 'react'
import config from '@/src/config'
import type { DateRange, DanmakuStatsResponse, DashboardData, WordFreqResponse } from './type'
import type { Room } from '@/src/interface/Danmaku'
import dayjs from 'dayjs'

const { apiVersion } = config
const baseUrl = `/api/${apiVersion}/danmakus`

export const useDashboardData = (defaultHours: number = 1) => {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    wordFreqs: null,
    loading: true,
    loadingWordFreq: true,
    loadingWordcloud: true,
    error: null,
  })

  const [dateRange, setDateRange] = useState<DateRange>({})
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const refreshTrigger = useRef(0)
  const defaultHoursRef = useRef(defaultHours)
  const selectedRoomIdRef = useRef<number | null>(null)
  const dateRangeRef = useRef<DateRange>({})

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId
    dateRangeRef.current = dateRange
  }, [selectedRoomId, dateRange])

  const getPreviousHours = useCallback((interval: number = 1) => {
    const now = dayjs()
    const currentHour = now.startOf('hour')
    const oneHourAgo = currentHour.subtract(interval, 'hour')
    const startTime = oneHourAgo.toISOString()
    const endTime = currentHour.toISOString()
    return { startTime, endTime }
  }, [])

  const fetchStatsData = useCallback(async (params: Record<string, string>) => {
    try {
      setData((prev) => ({ ...prev, loading: true }))

      const searchParams = new URLSearchParams(params)
      const endpoint = `${baseUrl}/stats?${searchParams}`
      const response = await fetch(endpoint)

      if (!response.ok) {
        throw new Error(`Failed to fetch stats data`)
      }

      const result: DanmakuStatsResponse = await response.json()
      setData((prev) => ({
        ...prev,
        stats: result.data,
        loading: false,
      }))
    } catch (err) {
      console.error(`Error fetching stats data:`, err)
      setData((prev) => ({
        ...prev,
        error: `获取统计数据失败，请稍后重试`,
        loading: false,
      }))
    }
  }, [])

  const fetchWordFrequencyData = useCallback(async (params: Record<string, string>) => {
    try {
      setData((prev) => ({ ...prev, loading: true }))

      const searchParams = new URLSearchParams(params)
      const endpoint = `${baseUrl}/analysis-data?${searchParams}`
      const response = await fetch(endpoint)

      if (!response.ok) {
        throw new Error(`Failed to fetch analysis data`)
      }

      const result: WordFreqResponse = await response.json()
      setData((prev) => ({
        ...prev,
        wordFreqs: result.data || [],
        loading: false,
        loadingWordcloud: false,
        loadingWordFreq: false,
      }))
    } catch (err) {
      console.error(`Error fetching word frequency data:`, err)
      setData((prev) => ({
        ...prev,
        error: `获取词频数据失败，请稍后重试`,
        loading: false,
      }))
    }
  }, [])

  const fetchAllData = useCallback(
    async (range: DateRange = {}, roomId: number | null = null) => {
      const { startTime, endTime } = range

      const baseParams: Record<string, string> = {}
      if (startTime) baseParams.startTime = startTime
      if (endTime) baseParams.endTime = endTime
      if (roomId !== null && roomId !== -1) baseParams.roomId = roomId.toString()

      fetchStatsData({ topN: '20', ...baseParams })

      fetchWordFrequencyData({
        topN: '100',
        ...baseParams,
      })
    },
    [fetchStatsData, fetchWordFrequencyData],
  )

  // Function to fetch room list with pagination and search
  const fetchRooms = useCallback(
    async (
      page: number = 1,
      pageSize: number = 20,
      search?: string,
    ): Promise<{ data: Room[]; total: number }> => {
      try {
        const queryParams = new URLSearchParams()
        queryParams.append('page', page.toString())
        queryParams.append('pageSize', pageSize.toString())

        if (search) {
          queryParams.append('search', search)
        }

        queryParams.append('sorter', 'id asc')
        const endpoint = `${baseUrl}/rooms?${queryParams}`

        const response = await fetch(endpoint)
        if (!response.ok) {
          throw new Error(`Failed to fetch rooms`)
        }
        const result = await response.json()

        return {
          data: result.data || [],
          total: result.total || 0,
        }
      } catch (err) {
        console.error('Error fetching rooms:', err)
        return {
          data: [],
          total: 0,
        }
      }
    },
    [],
  )

  // Function to trigger data refresh
  const refreshData = useCallback(() => {
    refreshTrigger.current += 1
  }, [])

  // Update selected room handler
  const handleRoomChange = useCallback((roomId: number | null) => {
    setSelectedRoomId(roomId)
  }, [])

  // Main effect to handle data fetching
  useEffect(() => {
    const { startTime, endTime } = dateRange
    const hasCustomRange = startTime && endTime

    if (!hasCustomRange) {
      const { startTime, endTime } = getPreviousHours(defaultHoursRef.current)
      fetchAllData({ startTime, endTime }, selectedRoomId)
    } else {
      fetchAllData(dateRange, selectedRoomId)
    }
  }, [dateRange, selectedRoomId, fetchAllData, getPreviousHours])

  // Set up intervals for refreshing data - using refs to avoid stale closures
  useEffect(() => {
    const statsInterval = setInterval(
      () => {
        const { startTime, endTime } = dateRangeRef.current
        const hasCustomRange = startTime && endTime

        if (!hasCustomRange) {
          const { startTime, endTime } = getPreviousHours(defaultHoursRef.current)
          fetchStatsData({
            startTime: startTime,
            endTime: endTime,
            ...(selectedRoomIdRef.current !== null &&
              selectedRoomIdRef.current !== -1 && {
                roomId: selectedRoomIdRef.current.toString(),
              }),
          })
        } else {
          fetchStatsData({
            ...(dateRangeRef.current.startTime && {
              startTime: dateRangeRef.current.startTime,
            }),
            ...(dateRangeRef.current.endTime && {
              endTime: dateRangeRef.current.endTime,
            }),
            ...(selectedRoomIdRef.current !== null &&
              selectedRoomIdRef.current !== -1 && {
                roomId: selectedRoomIdRef.current.toString(),
              }),
          })
        }
      },
      10 * 60 * 1000,
    ) // 10 minutes

    const wordFreqInterval = setInterval(
      () => {
        const { startTime, endTime } = dateRangeRef.current
        const hasCustomRange = startTime && endTime

        if (!hasCustomRange) {
          const { startTime, endTime } = getPreviousHours(defaultHoursRef.current)
          fetchWordFrequencyData({
            topN: '100',
            startTime: startTime,
            endTime: endTime,
            ...(selectedRoomIdRef.current !== null &&
              selectedRoomIdRef.current !== -1 && {
                roomId: selectedRoomIdRef.current.toString(),
              }),
          })
        } else {
          fetchWordFrequencyData({
            topN: '100',
            ...(dateRangeRef.current.startTime && {
              startTime: dateRangeRef.current.startTime,
            }),
            ...(dateRangeRef.current.endTime && {
              endTime: dateRangeRef.current.endTime,
            }),
            ...(selectedRoomIdRef.current !== null &&
              selectedRoomIdRef.current !== -1 && {
                roomId: selectedRoomIdRef.current.toString(),
              }),
          })
        }
      },
      60 * 60 * 1000,
    ) // 1 hour

    return () => {
      clearInterval(statsInterval)
      clearInterval(wordFreqInterval)
    }
  }, [fetchStatsData, fetchWordFrequencyData, getPreviousHours])

  return {
    data: { ...data, error: data.error },
    actions: {
      setDateRange,
      refreshData,
      handleRoomChange,
      fetchRooms,
      selectedRoomId,
    },
  }
}

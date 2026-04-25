import config from '@/src/config'
import type { DanmakuStatsResponse, WordFreqResponse } from '@/src/views/dashboard/type'

const { apiVersion } = config
const baseUrl = `/api/${apiVersion}/danmakus`

export interface DashboardService {
  fetchStats: (
    params: Record<string, string>,
    signal?: AbortSignal,
  ) => Promise<DanmakuStatsResponse>
  fetchWordFreq: (params: Record<string, string>, signal?: AbortSignal) => Promise<WordFreqResponse>
}

export const createDashboardService = (): DashboardService => {
  return {
    fetchStats: async (params, signal) => {
      const searchParams = new URLSearchParams(params)
      const endpoint = `${baseUrl}/stats?${searchParams}`
      const response = await fetch(endpoint, { signal })
      if (!response.ok) throw new Error(`获取统计数据失败 (${response.status})`)
      return response.json()
    },

    fetchWordFreq: async (params, signal) => {
      const searchParams = new URLSearchParams(params)
      const endpoint = `${baseUrl}/analysis-data?${searchParams}`
      const response = await fetch(endpoint, { signal })
      if (!response.ok) throw new Error(`获取词频数据失败 (${response.status})`)
      return response.json()
    },
  }
}

import config from '@/src/config'
import type { Danmaku } from '@/src/interface/danmaku/type'
import type { PaginationResponse } from '@/src/interface/shared/type'
import type { DanmakuSearchParams } from '@/src/interface/management/type'

const { apiVersion } = config
const baseUrl = `/api/${apiVersion}/danmakus`

export interface DanmakuService {
  fetchDanmakus: (
    searchParams: DanmakuSearchParams | null,
    options?: { signal?: AbortSignal },
  ) => Promise<PaginationResponse<Danmaku>>
  deleteDanmaku: (id: string) => Promise<boolean>
  updateDanmaku: (id: string, data: Partial<Danmaku>) => Promise<boolean>
}

export const createDanmakuService = (): DanmakuService => {
  return {
    fetchDanmakus: async (
      searchParams: DanmakuSearchParams | null,
      options?: { signal?: AbortSignal },
    ): Promise<PaginationResponse<Danmaku>> => {
      const queryParams = new URLSearchParams()

      if (searchParams) {
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== '' && value !== undefined && value !== null) {
            queryParams.append(key, value.toString())
          }
        })
      }

      const endpoint = `${baseUrl}?${queryParams.toString()}`
      const response = await fetch(endpoint, { signal: options?.signal })

      if (!response.ok) {
        throw new Error(`获取弹幕列表失败: ${response.status}`)
      }

      return await response.json()
    },

    deleteDanmaku: async (id: string): Promise<boolean> => {
      const endpoint = `${baseUrl}/${id}`
      const response = await fetch(endpoint, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`删除弹幕失败: ${response.status}`)
      }
      return true
    },

    updateDanmaku: async (id: string, data: Partial<Danmaku>): Promise<boolean> => {
      const endpoint = `${baseUrl}/${id}`

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`更新弹幕失败: ${response.status}`)
      }
      return true
    },
  }
}

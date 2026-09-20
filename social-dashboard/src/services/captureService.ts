import config from "@/src/config"
import type {
  CaptureJob,
  CaptureSearchParams,
  StartCaptureRequest,
  StartCaptureResponse,
  StopCaptureRequest,
} from "@/src/interface/capture/type"
import type { PaginationResponse } from "@/src/interface/shared/type"

const { apiVersion } = config
const baseUrl = `/api/${apiVersion}/danmakus`

export interface CaptureService {
  fetchJobs: (
    searchParams: CaptureSearchParams | null,
    options?: { signal?: AbortSignal },
  ) => Promise<PaginationResponse<CaptureJob>>
  startCapture: (request: StartCaptureRequest) => Promise<StartCaptureResponse>
  stopCapture: (request: StopCaptureRequest) => Promise<void>
}

export const createCaptureService = (): CaptureService => {
  return {
    fetchJobs: async (
      searchParams: CaptureSearchParams | null,
      options?: { signal?: AbortSignal },
    ) => {
      const queryParams = new URLSearchParams()

      if (searchParams) {
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== "" && value !== undefined && value !== null) {
            queryParams.append(key, value.toString())
          }
        })
      }

      const endpoint = `${baseUrl}/capture/jobs?${queryParams.toString()}`
      const response = await fetch(endpoint, { signal: options?.signal })

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    },

    startCapture: async (request: StartCaptureRequest): Promise<StartCaptureResponse> => {
      const response = await fetch(`${baseUrl}/capture/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error("Failed to start capture")
      }

      const result: StartCaptureResponse = await response.json()

      return result
    },

    stopCapture: async (request: StopCaptureRequest): Promise<void> => {
      const response = await fetch(`${baseUrl}/capture/stop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error("Failed to stop capture")
      }
    },
  }
}

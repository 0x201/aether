import { useEffect, useCallback, useMemo, useRef, useReducer } from 'react'
import type { CaptureJob, CaptureSearchParams } from '@/src/interface/capture/type'
import { createCaptureService } from '@/src/services/captureService'
import type { MessageInstance } from 'antd/es/message/interface'
import { useRoomOptions } from './useResourceOptions'

interface CaptureState {
  jobList: CaptureJob[]
  loading: boolean
  currentPage: number
  total: number
  pageSize: number
  sorter: string | null
  searchParams: CaptureSearchParams
  captureStartRes: string
  isCaptureSuccess: boolean
  error: Error | null
}

type CaptureAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_JOB_LIST'; payload: { data: CaptureJob[]; total: number } }
  | { type: 'SET_PAGE'; payload: { page: number; pageSize?: number } }
  | { type: 'SET_SORTER'; payload: string | null }
  | { type: 'SET_SEARCH_PARAMS'; payload: CaptureSearchParams }
  | { type: 'RESET_SEARCH' }
  | { type: 'SET_CAPTURE_SUCCESS'; payload: string }
  | { type: 'CLEAR_CAPTURE_SUCCESS' }
  | { type: 'SET_ERROR'; payload: Error | null }

const initialState: CaptureState = {
  jobList: [],
  loading: false,
  currentPage: 1,
  total: 0,
  pageSize: 20,
  sorter: null,
  searchParams: { page: 1, pageSize: 20, status: '', roomId: '' },
  captureStartRes: '',
  isCaptureSuccess: false,
  error: null,
}

function captureReducer(state: CaptureState, action: CaptureAction): CaptureState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_JOB_LIST':
      return { ...state, jobList: action.payload.data, total: action.payload.total, error: null }
    case 'SET_PAGE':
      return {
        ...state,
        currentPage: action.payload.page,
        pageSize: action.payload.pageSize ?? state.pageSize,
      }
    case 'SET_SORTER':
      return { ...state, sorter: action.payload }
    case 'RESET_SEARCH':
      return { ...state, searchParams: initialState.searchParams }
    case 'SET_SEARCH_PARAMS':
      return { ...state, searchParams: action.payload, currentPage: 1 }
    case 'SET_CAPTURE_SUCCESS':
      return { ...state, captureStartRes: action.payload, isCaptureSuccess: true }
    case 'CLEAR_CAPTURE_SUCCESS':
      return { ...state, isCaptureSuccess: false, captureStartRes: '' }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    default:
      return state
  }
}

interface UseCaptureMgtProps {
  messageApi: MessageInstance
}

export const useCaptureMgt = ({ messageApi }: UseCaptureMgtProps) => {
  const [state, dispatch] = useReducer(captureReducer, initialState)
  const abortControllerRef = useRef<AbortController | null>(null)
  const errorFlagRef = useRef(false)
  const service = useMemo(() => createCaptureService(), [])
  const { fetchOptions: fetchRoomOptions, resetError: resetRoomError } = useRoomOptions(messageApi)

  const requestParams = useMemo(
    () => ({
      ...state.searchParams,
      page: state.currentPage,
      pageSize: state.pageSize,
      ...(state.sorter ? { sorter: state.sorter } : {}),
    }),
    [state.searchParams, state.currentPage, state.pageSize, state.sorter],
  )
  const cancelPendingRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const fetchJobs = useCallback(async () => {
    if (errorFlagRef.current) return
    cancelPendingRequest()

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await service.fetchJobs(requestParams, { signal: abortController.signal })
      dispatch({ type: 'SET_JOB_LIST', payload: { data: response.data, total: response.total } })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('获取任务列表失败:', error)
      if (!errorFlagRef.current) {
        const errorMessage = '获取任务列表失败，请检查后端服务是否正常'
        messageApi.error(errorMessage)
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [service, requestParams, messageApi, cancelPendingRequest, dispatch])

  useEffect(() => {
    fetchJobs()
    return cancelPendingRequest
  }, [fetchJobs, cancelPendingRequest])

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
        dispatch({
          type: 'SET_CAPTURE_SUCCESS',
          payload: `开始捕获直播间 -> 主播: ${result.data.roomName}`,
        })
        resetRoomError()
        await fetchJobs()
      } catch (error) {
        console.error('启动捕获任务失败:', error)
        messageApi.error('启动捕获任务失败')
      }
    },
    [service, messageApi, fetchJobs, resetRoomError],
  )

  const stopCapture = useCallback(
    async (roomId: number) => {
      try {
        await service.stopCapture({ roomId })
        resetRoomError()
        await fetchJobs()
      } catch (error) {
        console.error('停止捕获任务失败:', error)
        messageApi.error('停止捕获任务失败')
      }
    },
    [service, fetchJobs, resetRoomError, messageApi],
  )

  const handlePageChange = useCallback((page: number, pageSize?: number) => {
    dispatch({ type: 'SET_PAGE', payload: { page, pageSize } })
  }, [])

  const handleSearch = useCallback(
    (newSearchParams: CaptureSearchParams) => {
      dispatch({ type: 'SET_SEARCH_PARAMS', payload: newSearchParams })
      resetRoomError()
    },
    [resetRoomError],
  )

  const handleResetSearch = useCallback(() => {
    resetRoomError()
    dispatch({
      type: 'RESET_SEARCH',
    })
  }, [resetRoomError])

  const setSorter = useCallback((sorter: string | null) => {
    dispatch({ type: 'SET_SORTER', payload: sorter })
  }, [])

  const clearCaptureSuccess = useCallback(() => {
    dispatch({ type: 'CLEAR_CAPTURE_SUCCESS' })
  }, [])

  return {
    state: {
      ...state,
      hasError: state.error !== null,
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
      clearCaptureSuccess,
    },
  }
}

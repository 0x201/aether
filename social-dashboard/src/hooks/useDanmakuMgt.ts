import { useEffect, useCallback, useMemo, useRef, useReducer } from 'react'
import type { Danmaku } from '@/src/interface/danmaku/type'
import type { DanmakuSearchParams } from '@/src/interface/management/type'
import { createDanmakuService } from '@/src/services/danmakuService'
import type { MessageInstance } from 'antd/es/message/interface'
import { useRoomOptions } from './useResourceOptions'

interface DanmakuState {
  danmakuList: Danmaku[]
  loading: boolean
  editingDanmaku: Danmaku | null
  isModalVisible: boolean
  total: number
  currentPage: number
  pageSize: number
  sorter: string | null
  searchParams: DanmakuSearchParams
  error: Error | null
}

type DanmakuAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DANMAKU_LIST'; payload: { data: Danmaku[]; total: number } }
  | { type: 'SET_PAGE'; payload: { page: number; pageSize?: number } }
  | { type: 'SET_SEARCH'; payload: DanmakuSearchParams }
  | { type: 'RESET_SEARCH' }
  | { type: 'SET_SORTER'; payload: string | null }
  | { type: 'SET_EDITING_DANMAKU'; payload: Danmaku | null }
  | { type: 'SET_MODAL_VISIBLE'; payload: boolean }
  | { type: 'CLEAR_ERROR' }

const initialState: DanmakuState = {
  danmakuList: [],
  loading: false,
  editingDanmaku: null,
  isModalVisible: false,
  total: 0,
  currentPage: 1,
  pageSize: 10,
  sorter: null,
  searchParams: {
    page: 1,
    pageSize: 10,
    userName: '',
    content: '',
    roomId: '',
  },
  error: null,
}

function danmakuReducer(state: DanmakuState, action: DanmakuAction): DanmakuState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_DANMAKU_LIST':
      return {
        ...state,
        danmakuList: action.payload.data,
        total: action.payload.total,
        loading: false,
        error: null,
      }
    case 'SET_PAGE':
      return {
        ...state,
        currentPage: action.payload.page,
        pageSize: action.payload.pageSize ?? state.pageSize,
        error: null,
      }
    case 'SET_SEARCH':
      return {
        ...state,
        searchParams: action.payload,
        currentPage: 1,
        error: null,
      }
    case 'RESET_SEARCH':
      return {
        ...state,
        searchParams: {
          page: 1,
          pageSize: 10,
          userName: undefined,
          content: undefined,
          roomId: undefined,
          startTime: undefined,
          endTime: undefined,
        },
        currentPage: 1,
        error: null,
      }
    case 'SET_SORTER':
      return { ...state, sorter: action.payload, error: null }
    case 'SET_EDITING_DANMAKU':
      return { ...state, editingDanmaku: action.payload }
    case 'SET_MODAL_VISIBLE':
      return { ...state, isModalVisible: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

interface UseDanmakuMgtProps {
  messageApi: MessageInstance
}

export const useDanmakuMgt = ({ messageApi }: UseDanmakuMgtProps) => {
  const [state, dispatch] = useReducer(danmakuReducer, initialState)
  const errorFlagRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const service = useMemo(() => createDanmakuService(), [])
  const { fetchOptions: fetchRoomOptions, resetError: resetRoomError } = useRoomOptions(messageApi)

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

  const fetchDanmakus = useCallback(async () => {
    if (errorFlagRef.current) return
    cancelPendingRequest()

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      const response = await service.fetchDanmakus(requestParams, {
        signal: abortController.signal,
      })
      errorFlagRef.current = false
      dispatch({
        type: 'SET_DANMAKU_LIST',
        payload: { data: response.data, total: response.total },
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('Failed to fetch danmaku list:', error)
      if (!errorFlagRef.current) {
        messageApi.error('获取弹幕列表失败，请检查后端服务是否正常')
        errorFlagRef.current = true
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [service, requestParams, messageApi, cancelPendingRequest, dispatch])

  useEffect(() => {
    fetchDanmakus()
    return () => {
      cancelPendingRequest()
    }
  }, [fetchDanmakus, cancelPendingRequest])

  const handlePageChange = useCallback(
    (page: number, limit?: number) => {
      resetRoomError()
      dispatch({ type: 'SET_PAGE', payload: { page, pageSize: limit } })
    },
    [resetRoomError],
  )

  const handleSearch = useCallback(
    (newSearchParams: DanmakuSearchParams) => {
      resetRoomError()
      dispatch({ type: 'SET_SEARCH', payload: newSearchParams })
    },
    [resetRoomError],
  )

  const handleResetSearch = useCallback(() => {
    resetRoomError()
    dispatch({ type: 'RESET_SEARCH' })
  }, [resetRoomError])

  const setSorter = useCallback((sorter: string | null) => {
    dispatch({ type: 'SET_SORTER', payload: sorter })
  }, [])

  const setEditingDanmaku = useCallback((danmaku: Danmaku | null) => {
    dispatch({ type: 'SET_EDITING_DANMAKU', payload: danmaku })
  }, [])

  const setIsModalVisible = useCallback((visible: boolean) => {
    dispatch({ type: 'SET_MODAL_VISIBLE', payload: visible })
  }, [])

  const clearError = useCallback(() => {
    errorFlagRef.current = false
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await service.deleteDanmaku(id)
        messageApi.success('删除成功')
        fetchDanmakus()
      } catch (error) {
        console.error('Failed to delete danmaku: ', error as Error)
        messageApi.error('删除失败')
      }
    },
    [service, fetchDanmakus, messageApi],
  )

  const handleUpdate = useCallback(
    async (id: number, data: Partial<Danmaku>) => {
      try {
        await service.updateDanmaku(id, data)
        messageApi.success('更新成功')
        fetchDanmakus()
      } catch (error) {
        console.error('Failed to update danmaku: ', error as Error)
        messageApi.error('更新失败')
      }
    },
    [service, fetchDanmakus, messageApi],
  )

  return {
    state: {
      danmakuList: state.danmakuList,
      loading: state.loading,
      editingDanmaku: state.editingDanmaku,
      isModalVisible: state.isModalVisible,
      total: state.total,
      currentPage: state.currentPage,
      pageSize: state.pageSize,
      sorter: state.sorter,
      searchParams: state.searchParams,
      error: state.error,
      medalLevelColors,
      userLevelColors,
    },
    actions: {
      fetchDanmakus,
      handlePageChange,
      handleSearch,
      handleResetSearch,
      handleDelete,
      handleUpdate,
      setEditingDanmaku,
      setIsModalVisible,
      setSorter,
      clearError,
      fetchRoomOptions,
      resetRoomError,
    },
  }
}

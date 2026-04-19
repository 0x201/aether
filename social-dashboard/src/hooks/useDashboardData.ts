// src/hooks/useDashboardData.ts
import { useReducer, useEffect, useCallback, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import type { DateRange, DanmakuStatsResponse, WordFreqResponse } from "@/src/views/dashboard/type";
import { createDashboardService } from "@/src/services/dashboardService";
import { useRoomOptions } from "./useResourceOptions";
import type { MessageInstance } from "antd/es/message/interface";

// 状态定义
interface DashboardState {
  stats: DanmakuStatsResponse["data"] | null;
  wordFreqs: WordFreqResponse["data"] | null;
  loadingStats: boolean;
  loadingWordFreq: boolean;
  error: string | null;
}

type DashboardAction =
  | { type: "SET_STATS_LOADING"; payload: boolean }
  | { type: "SET_WORDFREQ_LOADING"; payload: boolean }
  | { type: "SET_STATS"; payload: DanmakuStatsResponse["data"] }
  | { type: "SET_WORDFREQ"; payload: WordFreqResponse["data"] }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_ERROR" };

const initialState: DashboardState = {
  stats: null,
  wordFreqs: null,
  loadingStats: true,
  loadingWordFreq: true,
  error: null,
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "SET_STATS_LOADING":
      return { ...state, loadingStats: action.payload };
    case "SET_WORDFREQ_LOADING":
      return { ...state, loadingWordFreq: action.payload };
    case "SET_STATS":
      return { ...state, stats: action.payload, loadingStats: false };
    case "SET_WORDFREQ":
      return { ...state, wordFreqs: action.payload, loadingWordFreq: false };
    case "SET_ERROR":
      return { ...state, error: action.payload, loadingStats: false, loadingWordFreq: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

interface UseDashboardDataProps {
  messageApi: MessageInstance;
  defaultHours?: number;
}

export const useDashboardData = ({ messageApi, defaultHours = 1 }: UseDashboardDataProps) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const service = useMemo(() => createDashboardService(), []);
  const { fetchOptions: fetchRoomOptions } = useRoomOptions(messageApi);
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const errorFlagRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const dateRangeRef = useRef<DateRange>({});
  const selectedRoomIdRef = useRef<number | null>(null);
  const defaultHoursRef = useRef(defaultHours);

  useEffect(() => {
    dateRangeRef.current = dateRange;
    selectedRoomIdRef.current = selectedRoomId;
  }, [dateRange, selectedRoomId]);

  const cancelPendingRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const buildRequestParams = useCallback(
    (overrides?: { startTime?: string; endTime?: string; roomId?: number | null }) => {
      let { startTime, endTime } = overrides ?? dateRangeRef.current;
      const roomId = overrides?.roomId ?? selectedRoomIdRef.current;

      if (!startTime && !endTime) {
        const refRange = dateRangeRef.current;
        if (refRange.startTime && refRange.endTime) {
          startTime = refRange.startTime;
          endTime = refRange.endTime;
        } else {
          const defaultRange = getDefaultTimeRange();
          startTime = defaultRange.startTime;
          endTime = defaultRange.endTime;
        }
      }

      const params: Record<string, string> = {};
      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;
      if (roomId !== null && roomId !== -1) params.roomId = roomId.toString();
      return params;
    },
    [],
  );

  const fetchStats = useCallback(async () => {
    if (errorFlagRef.current) return;

    cancelPendingRequest();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    dispatch({ type: "SET_STATS_LOADING", payload: true });
    try {
      const params = buildRequestParams();
      params.topN = "20";
      const response = await service.fetchStats(params, abortController.signal);
      errorFlagRef.current = false;
      dispatch({ type: "SET_STATS", payload: response.data });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("获取统计数据失败:", error);
      if (!errorFlagRef.current) {
        messageApi.error("获取统计数据失败，请检查后端服务");
        errorFlagRef.current = true;
      }
      dispatch({ type: "SET_ERROR", payload: "获取统计数据失败" });
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [service, buildRequestParams, messageApi, cancelPendingRequest]);

  const fetchWordFrequency = useCallback(async () => {
    if (errorFlagRef.current) return;

    const abortController = new AbortController();

    dispatch({ type: "SET_WORDFREQ_LOADING", payload: true });
    try {
      const params = buildRequestParams();
      params.topN = "100";
      const response = await service.fetchWordFreq(params, abortController.signal);
      errorFlagRef.current = false;
      dispatch({ type: "SET_WORDFREQ", payload: response.data });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("获取词频数据失败:", error);
      if (!errorFlagRef.current) {
        messageApi.error("获取词频数据失败，请检查后端服务");
        errorFlagRef.current = true;
      }
      dispatch({ type: "SET_ERROR", payload: "获取词频数据失败" });
    }
  }, [service, buildRequestParams, messageApi]);

  const getDefaultTimeRange = useCallback(() => {
    const now = dayjs();
    const currentHour = now.startOf("hour");
    const startHour = currentHour.subtract(defaultHoursRef.current, "hour");
    return {
      startTime: startHour.toISOString(),
      endTime: currentHour.toISOString(),
    };
  }, []);

  const refreshAllData = useCallback(() => {
    errorFlagRef.current = false;
    fetchStats();
    fetchWordFrequency();
  }, [fetchStats, fetchWordFrequency, getDefaultTimeRange]);

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
    errorFlagRef.current = false;
  }, []);

  const handleRoomChange = useCallback((roomId: number | null) => {
    setSelectedRoomId(roomId);
    errorFlagRef.current = false;
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [dateRange, selectedRoomId, refreshAllData]);

  useEffect(() => {
    const statsInterval = setInterval(
      () => {
        const hasCustomRange = dateRangeRef.current.startTime && dateRangeRef.current.endTime;
        if (!hasCustomRange) {
          fetchStats();
        } else {
          fetchStats();
        }
      },
      10 * 60 * 1000,
    ); // 10 分钟

    const wordFreqInterval = setInterval(
      () => {
        fetchWordFrequency();
      },
      60 * 60 * 1000,
    ); // 1 小时

    return () => {
      clearInterval(statsInterval);
      clearInterval(wordFreqInterval);
    };
  }, [fetchStats, fetchWordFrequency]);

  const manualRefresh = useCallback(() => {
    refreshAllData();
  }, [refreshAllData]);

  return {
    state: {
      stats: state.stats,
      wordFreqs: state.wordFreqs,
      loading: state.loadingStats || state.loadingWordFreq,
      loadingStats: state.loadingStats,
      loadingWordFreq: state.loadingWordFreq,
      error: state.error,
    },
    actions: {
      setDateRange: handleDateRangeChange,
      handleRoomChange,
      refreshData: manualRefresh,
      fetchRoomOptions,
      selectedRoomId,
    },
  };
};

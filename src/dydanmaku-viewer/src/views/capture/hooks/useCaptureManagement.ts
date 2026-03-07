import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CaptureJob } from '../type';
import type { Room } from '@/src/interface/Danmaku';
import { createCaptureService } from '../services/captureService';
import type { MessageInstance } from 'antd/es/message/interface';

interface UseCaptureManagementProps {
  messageApi: MessageInstance;
}

export const useCaptureManagement = ({ messageApi }: UseCaptureManagementProps) => {
  const [jobs, setJobs] = useState<CaptureJob[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<string | null>(null);
  const [roomOptions, setRoomOptions] = useState<{ value: string, label: string }[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);
  const [captureStartRes, setCaptureStartRes] = useState<string>("");
  const [isCaptureSuccess, setIsCaptureSuccess] = useState<boolean>(false);

  const service = useMemo(() => createCaptureService(messageApi), [messageApi]);

  const fetchJobs = useCallback(async (page: number = 1, pageSize: number = 10, sorter: string | null = null) => {
    setLoading(true);
    try {
      const data = await service.fetchJobs(page, pageSize, sorter);
      setJobs(data.data);
      setTotal(data.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [service]);

  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const rooms = await service.fetchRooms();
      const options = rooms.map((room: Room) => ({
        value: room.roomId.toString(),
        label: `${room.anchorName} (房间ID: ${room.roomId})`
      }));
      setRoomOptions(options);
    } catch (error) {
      console.error('获取房间列表失败:', error);
    } finally {
      setLoadingRooms(false);
    }
  }, [service]);

  const startCapture = useCallback(async (roomId: string, duration: number) => {
    if (!roomId) {
      messageApi.error('请输入房间ID');
      return;
    }

    try {
      const result = await service.startCapture({
        roomId: Number(roomId),
        duration
      });

      setCaptureStartRes(`开始捕获直播间 -> 主播: ${result.data.anchorName}`);
      setIsCaptureSuccess(true);
      await fetchJobs(currentPage, pageSize, sort);
    } catch (error) {
      console.error('启动捕获任务失败:', error);
    }
  }, [service, currentPage, pageSize, sort, messageApi, fetchJobs]);

  const stopCapture = useCallback(async (roomId: number) => {
    try {
      await service.stopCapture({ roomId });
      await fetchJobs(currentPage, pageSize, sort);
    } catch (error) {
      console.error('停止捕获任务失败:', error);
    }
  }, [service, currentPage, pageSize, sort, fetchJobs]);

  const handlePageChange = useCallback((page: number, limit?: number) => {
    setCurrentPage(page);
    if (limit && limit !== pageSize) {
      setPageSize(limit);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchJobs(currentPage, pageSize, sort);
    fetchRooms();
  }, [currentPage, pageSize, sort, fetchJobs, fetchRooms]);

  return {
    state: {
      jobs,
      loading,
      currentPage,
      total,
      pageSize,
      sort,
      roomOptions,
      loadingRooms,
      captureStartRes,
      isCaptureSuccess
    },
    actions: {
      fetchJobs,
      startCapture,
      stopCapture,
      handlePageChange,
      setSort,
      setIsCaptureSuccess
    }
  };
};
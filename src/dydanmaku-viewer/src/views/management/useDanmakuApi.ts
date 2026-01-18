import config from "@/src/config";
import type { Danmaku } from "@/src/interface/Danmaku";
import { useCallback } from "react";
import type { DanmakuSearchParams } from "./type";
import type { PaginationData } from "@/src/interface/PaginationData";
import type { MessageInstance } from "antd/es/message/interface";

const { apiBaseUrl, apiVersion } = config;
const baseUrl = `/api/${apiVersion}/danmakus`;

export const useDanmakuApi = (messageApi: MessageInstance) => {
  const fetchDanmakuList = useCallback(async (
    page: number = 1,
    pageSize: number = 20,
    sorter: string | null = null,
    searchParams: DanmakuSearchParams | null = null
  ): Promise<PaginationData<Danmaku>> => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('pageSize', pageSize.toString());

      if (sorter) {
        queryParams.append('sorter', sorter);
      }
      if (searchParams) {
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== '' && value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const endpoint = `${baseUrl}?${queryParams.toString()}`;
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`获取弹幕列表失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch danmaku list:', error);
      messageApi.error('获取弹幕列表失败');
      throw error;
    }
  }, []);

  const deleteDanmaku = useCallback(async (id: string): Promise<boolean> => {
    try {
      const endpoint = `${baseUrl}/${id}`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (response.ok) {
        messageApi.success('删除成功');
        return true;
      } else {
        messageApi.error('删除失败');
        return false;
      }
    } catch (error) {
      console.error('Failed to delete danmaku:', error);
      messageApi.error('删除失败');
      return false;
    }
  }, []);

  const updateDanmaku = useCallback(async (id: string, data: Partial<Danmaku>): Promise<boolean> => {
    try {
      const endpoint = `${baseUrl}/${id}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        messageApi.success('更新成功');
        return true;
      } else {
        messageApi.error('更新失败');
        return false;
      }
    } catch (error) {
      console.error('Failed to update danmaku:', error);
      messageApi.error('更新失败');
      return false;
    }
  }, []);

  return {
    fetchDanmakuList,
    deleteDanmaku,
    updateDanmaku
  };
};
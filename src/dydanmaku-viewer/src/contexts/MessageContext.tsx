import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { HubConnection, HubConnectionBuilder, HttpTransportType, HubConnectionState } from '@microsoft/signalr';
import config from '@/src/config';

interface Notification {
  id: string;
  completedAt: string;
  roomId: string;
  frequenciesCount: number;
  startDate: string;
  endDate: string;
  periodType: string;
}

interface MessageContextType {
  notifications: Notification[];
  unreadCount: number;
  connection: HubConnection | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  // 使用 useRef 来跟踪组件是否已挂载
  const isMountedRef = React.useRef(true);

  useEffect(() => {
    const maxRetries = 5;
    let retryTimeout: NodeJS.Timeout;
    
    // 创建连接函数
    const createHubConnection = (): HubConnection => {
      const hubConnection = new HubConnectionBuilder()
        .withUrl(`/api/danmaku-hub`, {
          transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents,
          timeout: 15000, // 增加超时时间到15秒
          headers: {
            // 如果需要认证，可以在这里添加headers
            // 'Authorization': `Bearer ${token}` // 如果需要的话
          }
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .build();

      hubConnection.on('AnalyticsCompleted', (data: Notification) => {
        if (!isMountedRef.current) return; // 检查组件是否仍挂载
        
        const newNotification: Notification = {
          id: `${data.roomId}-${data.completedAt}`,
          completedAt: data.completedAt,
          roomId: data.roomId,
          frequenciesCount: data.frequenciesCount,
          startDate: data.startDate,
          endDate: data.endDate,
          periodType: data.periodType
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      hubConnection.on('NewNotification', (count: number) => {
        if (!isMountedRef.current) return; // 检查组件是否仍挂载
        setUnreadCount(count);
      });

      hubConnection.onclose((error?: Error) => {
        if (!isMountedRef.current) return; // 检查组件是否仍挂载
        
        console.log('Message context SignalR connection closed', error);
        setIsConnected(false);
        setConnection(null);
        
        // 如果不是手动断开且未达到最大重试次数，则尝试重连
        if (reconnectAttempts < maxRetries && error && !error.message.includes('stop')) {
          setReconnectAttempts(prev => prev + 1);
          retryTimeout = setTimeout(() => {
            if (isMountedRef.current) { // 再次检查组件是否仍挂载
              console.log(`Attempting to reconnect... (${reconnectAttempts + 1}/${maxRetries})`);
              startConnection();
            }
          }, 5000);
        }
      });

      hubConnection.onreconnecting((error?: Error) => {
        if (!isMountedRef.current) return; // 检查组件是否仍挂载
        console.log('Message context SignalR reconnecting...', error);
        setIsConnected(false);
      });

      hubConnection.onreconnected((connectionId?: string) => {
        if (!isMountedRef.current) return; // 检查组件是否仍挂载
        console.log('Message context SignalR reconnected', connectionId);
        setIsConnected(true);
        setConnection(hubConnection);
        setReconnectAttempts(0);
      });

      return hubConnection;
    };

    // 启动连接函数
    const startConnection = async () => {
      if (!isMountedRef.current) return; // 检查组件是否仍挂载

      const hubConnection = createHubConnection();
      
      try {
        await hubConnection.start();
        if (!isMountedRef.current) { // 连接成功后再次检查组件是否仍挂载
          // 如果组件已卸载，立即停止连接
          hubConnection.stop();
          return;
        }
        
        setIsConnected(true);
        setConnection(hubConnection);
        setReconnectAttempts(0);
        console.log('Message context SignalR connection started');
      } catch (err: any) {
        if (!isMountedRef.current) return; // 检查组件是否仍挂载
        
        console.error('Message context SignalR connection error: ', err);
        
        // 区分不同类型的错误
        if (err.message && (err.message.includes('negotiation') || err.message.includes('Network Error'))) {
          console.warn('Negotiation failed or network error, will attempt to retry...');
          
          if (reconnectAttempts < maxRetries) {
            setReconnectAttempts(prev => prev + 1);
            retryTimeout = setTimeout(() => {
              if (isMountedRef.current) { // 检查组件是否仍挂载
                console.log(`Negotiation failed, retrying... (${reconnectAttempts + 1}/${maxRetries})`);
                startConnection();
              }
            }, 5000);
          }
        }
      }
    };

    // 开始连接
    startConnection();

    // 清理函数
    return () => {
      isMountedRef.current = false; // 标记组件已卸载
      
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      
      if (connection) {
        connection.stop().then(() => {
          console.log('SignalR connection stopped during cleanup');
        }).catch(error => {
          console.error('Error stopping SignalR connection during cleanup:', error);
        });
      }
    };
  }, []); // 注意：依赖数组为空，确保只运行一次

  const connect = async () => {
    if (!isMountedRef.current) return; // 检查组件是否仍挂载
    
    if (connection && connection.state === HubConnectionState.Disconnected) { // 使用枚举而不是数字
      try {
        await connection.start();
        if (isMountedRef.current) { // 检查组件是否仍挂载
          setIsConnected(true);
          setReconnectAttempts(0);
          console.log('Message context SignalR connection restarted');
        }
      } catch (err) {
        console.error('Failed to restart connection:', err);
      }
    }
  };

  const disconnect = async () => {
    if (!isMountedRef.current) return; // 检查组件是否仍挂载
    
    if (connection) {
      try {
        await connection.stop();
        if (isMountedRef.current) { // 检查组件是否仍挂载
          setIsConnected(false);
        }
        console.log('Message context SignalR connection stopped');
      } catch (err) {
        console.error('Error stopping connection:', err);
      }
    }
  };

  const markAsRead = (id: string) => {
    if (!isMountedRef.current) return; // 检查组件是否仍挂载
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    if (!isMountedRef.current) return; // 检查组件是否仍挂载
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <MessageContext.Provider
      value={{
        notifications,
        unreadCount,
        connection,
        isConnected,
        connect,
        disconnect,
        markAsRead,
        clearAll
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessageContext = (): MessageContextType => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessageContext must be used within a MessageProvider');
  }
  return context;
};
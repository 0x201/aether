import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { HubConnection, HubConnectionBuilder, HttpTransportType, HubConnectionState } from '@microsoft/signalr';

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

  const isMountedRef = React.useRef(true);

  useEffect(() => {
    const maxRetries = 5;
    let retryTimeout: NodeJS.Timeout;
    
    const createHubConnection = (): HubConnection => {
      const hubConnection = new HubConnectionBuilder()
        .withUrl(`/api/danmaku-hub`, {
          transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents,
          timeout: 15000,
          headers: {
          }
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .build();

      hubConnection.on('AnalyticsCompleted', (notification: Notification) => {
        console.log('New notification:', notification);
        if (!isMountedRef.current) return;
        
        const newNotification: Notification = {
          id: `${notification.roomId}-${notification.completedAt}`,
          completedAt: notification.completedAt,
          roomId: notification.roomId,
          frequenciesCount: notification.frequenciesCount,
          startDate: notification.startDate,
          endDate: notification.endDate,
          periodType: notification.periodType
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      hubConnection.on('NewNotification', (count: number) => {
        if (!isMountedRef.current) return;
        setUnreadCount(count);
      });

      hubConnection.onclose((error?: Error) => {
        if (!isMountedRef.current) return;
        
        console.log('Message context SignalR connection closed', error);
        setIsConnected(false);
        setConnection(null);
        
        if (reconnectAttempts < maxRetries && error && !error.message.includes('stop')) {
          setReconnectAttempts(prev => prev + 1);
          retryTimeout = setTimeout(() => {
            if (isMountedRef.current) {
              console.log(`Attempting to reconnect... (${reconnectAttempts + 1}/${maxRetries})`);
              startConnection();
            }
          }, 5000);
        }
      });

      hubConnection.onreconnecting((error?: Error) => {
        if (!isMountedRef.current) return;
        console.log('Message context SignalR reconnecting...', error);
        setIsConnected(false);
      });

      hubConnection.onreconnected((connectionId?: string) => {
        if (!isMountedRef.current) return;
        console.log('Message context SignalR reconnected', connectionId);
        setIsConnected(true);
        setConnection(hubConnection);
        setReconnectAttempts(0);
      });

      return hubConnection;
    };


    const startConnection = async () => {
      if (!isMountedRef.current) return;

      const hubConnection = createHubConnection();
      
      try {
        await hubConnection.start();
        if (!isMountedRef.current) {
          hubConnection.stop();
          return;
        }
        
        setIsConnected(true);
        setConnection(hubConnection);
        setReconnectAttempts(0);
        console.log('Message context SignalR connection started');
      } catch (err: any) {
        if (!isMountedRef.current) return;
        
        console.error('Message context SignalR connection error: ', err);
        
        if (err.message && (err.message.includes('negotiation') || err.message.includes('Network Error'))) {
          console.warn('Negotiation failed or network error, will attempt to retry...');
          
          if (reconnectAttempts < maxRetries) {
            setReconnectAttempts(prev => prev + 1);
            retryTimeout = setTimeout(() => {
              if (isMountedRef.current) {
                console.log(`Negotiation failed, retrying... (${reconnectAttempts + 1}/${maxRetries})`);
                startConnection();
              }
            }, 5000);
          }
        }
      }
    };

    startConnection();

    return () => {
      isMountedRef.current = false;
      
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
  }, []);

  const connect = async () => {
    if (!isMountedRef.current) return;
    
    if (connection && connection.state === HubConnectionState.Disconnected) {
      try {
        await connection.start();
        if (isMountedRef.current) {
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
    if (!isMountedRef.current) return;
    
    if (connection) {
      try {
        await connection.stop();
        if (isMountedRef.current) {
          setIsConnected(false);
        }
        console.log('Message context SignalR connection stopped');
      } catch (err) {
        console.error('Error stopping connection:', err);
      }
    }
  };

  const markAsRead = (id: string) => {
    if (!isMountedRef.current) return;
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    if (!isMountedRef.current) return;
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
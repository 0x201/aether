import React, { useState, useEffect, useRef, type ReactNode, useMemo, useCallback } from 'react'
import {
  HubConnection,
  HubConnectionBuilder,
  HttpTransportType,
  HubConnectionState,
} from '@microsoft/signalr'
import type { Message, AnalyticsMessage, DanmakuMessage, SystemMessage } from '../interface/Message'
import { MessageContext, type MessageContextType } from './useMessage'

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [connection, setConnection] = useState<HubConnection | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const connectionRef = useRef<HubConnection | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let isActive = true
    const startHeartbeat = (hubConnection: HubConnection) => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }

      heartbeatIntervalRef.current = setInterval(async () => {
        if (hubConnection.state === HubConnectionState.Connected) {
          try {
            await hubConnection.invoke('Heartbeat')
            console.log('Heartbeat sent')
          } catch (error) {
            console.error('Heartbeat failed:', error)
          }
        }
      }, 30000)
    }

    const hubConnection = new HubConnectionBuilder()
      .withUrl(`/api/danmaku-hub`, {
        transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents,
        timeout: 15000,
        headers: {
          // 'Authorization': `Bearer ${authToken}`
        },
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .build()

    hubConnection.on('AnalyticsCompleted', (notification: AnalyticsMessage) => {
      console.log('Received analytics notification:', notification)
      const newNotification: AnalyticsMessage = {
        ...notification,
        id: `${notification.roomId}-${Date.now()}`,
      }

      setMessages((prev) => [newNotification, ...prev])
      setUnreadCount((prev) => prev + 1)
    })

    hubConnection.on('ReceiveNewDanmaku', (danmakuItems: DanmakuMessage[]) => {
      console.log('Received new danmaku:', danmakuItems)
      const newNotifications: Message[] = danmakuItems.map((danmaku) => ({
        ...danmaku,
        id: `${danmaku.roomId}-${danmaku.timestamp}-${danmaku.id || Date.now()}`,
      }))

      setMessages((prev) => [...newNotifications, ...prev])
      setUnreadCount((prev) => prev + newNotifications.length)
    })

    hubConnection.on('SystemNotification', (notification: SystemMessage) => {
      console.log('Received system notification:', notification)
      const newNotification: SystemMessage = {
        ...notification,
        id: `sys-${Date.now()}`,
      }

      setMessages((prev) => [newNotification, ...prev])
      setUnreadCount((prev) => prev + 1)
    })

    hubConnection.onclose((error?: Error) => {
      if (!isActive) return

      console.log('Message context SignalR connection closed', error)
      setIsConnected(false)

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
    })

    hubConnection.onreconnecting((error?: Error) => {
      if (!isActive) return
      console.log('Message context SignalR reconnecting...', error)
      setIsConnected(false)

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
    })

    hubConnection.onreconnected((connectionId?: string) => {
      if (!isActive) return
      console.log('Message context SignalR reconnected', connectionId)
      setIsConnected(true)
      startHeartbeat(hubConnection)
    })

    hubConnection.on('UnreadCountUpdated', (count: number) => {
      setUnreadCount(count)
    })

    hubConnection
      .start()
      .then(() => {
        if (!isActive) {
          hubConnection.stop()
          return
        }

        connectionRef.current = hubConnection
        setConnection(hubConnection)
        setIsConnected(true)
        console.log('Message context SignalR connection started')
        startHeartbeat(hubConnection)
      })
      .catch((error: Error) => {
        if (!isActive) return
        console.error('Message context SignalR connection error: ', error)
      })

    return () => {
      isActive = false

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }

      const conn = connectionRef.current

      if (conn) {
        connectionRef.current = null
        conn
          .stop()
          .then(() => {
            console.log('SignalR connection stopped during cleanup')
          })
          .catch((error) => {
            console.error('Error stopping SignalR connection during cleanup:', error)
          })
      }
    }
  }, [])

  const connect = useCallback(async () => {
    const conn = connectionRef.current

    if (conn && conn.state === HubConnectionState.Disconnected) {
      try {
        await conn.start()
        setIsConnected(true)
        console.log('Message context SignalR connection restarted')

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
        }

        heartbeatIntervalRef.current = setInterval(async () => {
          if (conn.state === HubConnectionState.Connected) {
            try {
              await conn.invoke('Heartbeat')
              console.log('Heartbeat sent')
            } catch (error) {
              console.error('Heartbeat failed:', error)
            }
          }
        }, 30000)
      } catch (err) {
        console.error('Failed to restart connection:', err)
      }
    }
  }, [])

  const disconnect = useCallback(async () => {
    const conn = connectionRef.current

    if (conn) {
      try {
        await conn.stop()
        setIsConnected(true)

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }

        console.log('Message context SignalR connection stopped')
      } catch (err) {
        console.error('Error stopping connection:', err)
      }
    }
  }, [])

  const markAsRead = useCallback((id: string) => {
    setMessages((prev) => prev.filter((notification) => notification.id !== id))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const clearAll = useCallback(() => {
    setMessages([])
    setUnreadCount(0)
  }, [])

  const sendCommand = useCallback(async (command: string, data?: unknown) => {
    const conn = connectionRef.current
    if (conn && conn.state === HubConnectionState.Connected) {
      try {
        await conn.invoke(command, data)
        console.log(`Command sent: ${command}`, data)
      } catch (error) {
        console.error(`Error sending command ${command}:`, error)
        throw error
      }
    } else {
      console.warn('Cannot send command, connection not established')
      throw new Error('Connection not established')
    }
  }, [])

  const contextValue = useMemo<MessageContextType>(
    () => ({
      messages,
      unreadCount,
      connection,
      isConnected,
      connect,
      disconnect,
      markAsRead,
      clearAll,
      sendCommand,
    }),
    [
      messages,
      unreadCount,
      connection,
      isConnected,
      connect,
      disconnect,
      markAsRead,
      clearAll,
      sendCommand,
    ],
  )

  return <MessageContext.Provider value={contextValue}>{children}</MessageContext.Provider>
}

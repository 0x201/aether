import React, {
    useState,
    useEffect,
    type ReactNode,
    useMemo,
    useCallback,
} from 'react'
import {
    HubConnection,
    HubConnectionBuilder,
    HttpTransportType,
    HubConnectionState,
} from '@microsoft/signalr'
import type {
    Message,
    AnalyticsMessage,
    DanmakuMessage,
    SystemMessage,
} from '../interface/Message'
import { MessageContext, type MessageContextType } from './useMessage'

export const MessageProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [unreadCount, setUnreadCount] = useState<number>(0)
    const [connection, setConnection] = useState<HubConnection | null>(null)
    const [isConnected, setIsConnected] = useState<boolean>(false)
    const [reconnectAttempts, setReconnectAttempts] = useState<number>(0)

    const isMountedRef = React.useRef(true)
    const heartbeatIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const maxRetries = 10
        let retryTimeout: NodeJS.Timeout

        const createHubConnection = (): HubConnection => {
            const hubConnection = new HubConnectionBuilder()
                .withUrl(`/api/danmaku-hub`, {
                    transport:
                        HttpTransportType.WebSockets |
                        HttpTransportType.ServerSentEvents,
                    timeout: 15000,
                    headers: {
                        // 可以在这里添加认证头
                        // 'Authorization': `Bearer ${authToken}`
                    },
                })
                .withAutomaticReconnect([0, 2000, 10000, 30000])
                .build()

            hubConnection.on(
                'AnalyticsCompleted',
                (notification: AnalyticsMessage) => {
                    console.log(
                        'Received analytics notification:',
                        notification,
                    )
                    if (!isMountedRef.current) return

                    const newNotification: AnalyticsMessage = {
                        ...notification,
                        id: `${notification.roomId}-${Date.now()}`,
                    }

                    setMessages((prev) => [newNotification, ...prev])
                    setUnreadCount((prev) => prev + 1)
                },
            )

            hubConnection.on(
                'ReceiveNewDanmaku',
                (danmakuItems: DanmakuMessage[]) => {
                    console.log('Received new danmaku:', danmakuItems)
                    if (!isMountedRef.current) return

                    const newNotifications: Message[] = danmakuItems.map(
                        (danmaku) => ({
                            ...danmaku,
                            id: `${danmaku.roomId}-${danmaku.timestamp}-${danmaku.id || Date.now()}`,
                        }),
                    )

                    setMessages((prev) => [...newNotifications, ...prev])
                    setUnreadCount((prev) => prev + newNotifications.length)
                },
            )

            hubConnection.on(
                'SystemNotification',
                (notification: SystemMessage) => {
                    console.log('Received system notification:', notification)
                    if (!isMountedRef.current) return

                    const newNotification: SystemMessage = {
                        ...notification,
                        id: `sys-${Date.now()}`,
                    }

                    setMessages((prev) => [newNotification, ...prev])
                    setUnreadCount((prev) => prev + 1)
                },
            )

            hubConnection.on('UnreadCountUpdated', (count: number) => {
                if (!isMountedRef.current) return
                setUnreadCount(count)
            })

            hubConnection.onclose((error?: Error) => {
                if (!isMountedRef.current) return

                console.log('Message context SignalR connection closed', error)
                setIsConnected(false)
                setConnection(null)

                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current)
                    heartbeatIntervalRef.current = null
                }

                if (reconnectAttempts < maxRetries) {
                    setReconnectAttempts((prev) => prev + 1)
                    retryTimeout = setTimeout(
                        () => {
                            if (isMountedRef.current) {
                                console.log(
                                    `Attempting to reconnect... (${reconnectAttempts + 1}/${maxRetries})`,
                                )
                                startConnection()
                            }
                        },
                        5000 * Math.min(reconnectAttempts + 1, 5),
                    )
                }
            })

            hubConnection.onreconnecting((error?: Error) => {
                if (!isMountedRef.current) return
                console.log('Message context SignalR reconnecting...', error)
                setIsConnected(false)

                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current)
                    heartbeatIntervalRef.current = null
                }
            })

            hubConnection.onreconnected((connectionId?: string) => {
                if (!isMountedRef.current) return
                console.log('Message context SignalR reconnected', connectionId)
                setIsConnected(true)
                setConnection(hubConnection)
                setReconnectAttempts(0)
                startHeartbeat(hubConnection)
            })

            return hubConnection
        }

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

        const startConnection = async () => {
            if (!isMountedRef.current) return

            const hubConnection = createHubConnection()

            try {
                await hubConnection.start()
                if (!isMountedRef.current) {
                    hubConnection.stop()
                    return
                }

                setIsConnected(true)
                setConnection(hubConnection)
                setReconnectAttempts(0)
                console.log('Message context SignalR connection started')

                startHeartbeat(hubConnection)
            } catch (error) {
                if (!isMountedRef.current) return
                console.error(
                    'Message context SignalR connection error: ',
                    error,
                )
            }
        }

        startConnection()

        return () => {
            isMountedRef.current = false

            if (retryTimeout) {
                clearTimeout(retryTimeout)
            }

            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current)
                heartbeatIntervalRef.current = null
            }

            if (connection) {
                connection
                    .stop()
                    .then(() => {
                        console.log('SignalR connection stopped during cleanup')
                    })
                    .catch((error) => {
                        console.error(
                            'Error stopping SignalR connection during cleanup:',
                            error,
                        )
                    })
            }
        }
    }, [connection, reconnectAttempts])

    const connect = useCallback(async () => {
        if (!isMountedRef.current) return

        if (
            connection &&
            connection.state === HubConnectionState.Disconnected
        ) {
            try {
                await connection.start()
                if (isMountedRef.current) {
                    setIsConnected(true)
                    setReconnectAttempts(0)
                    console.log('Message context SignalR connection restarted')
                }

                if (connection) {
                    if (heartbeatIntervalRef.current) {
                        clearInterval(heartbeatIntervalRef.current)
                    }

                    heartbeatIntervalRef.current = setInterval(async () => {
                        if (connection.state === HubConnectionState.Connected) {
                            try {
                                await connection.invoke('Heartbeat')
                                console.log('Heartbeat sent')
                            } catch (error) {
                                console.error('Heartbeat failed:', error)
                            }
                        }
                    }, 30000)
                }
            } catch (err) {
                console.error('Failed to restart connection:', err)
            }
        }
    }, [connection])

    const disconnect = useCallback(async () => {
        if (!isMountedRef.current) return

        if (connection) {
            try {
                await connection.stop()
                if (isMountedRef.current) {
                    setIsConnected(false)
                }

                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current)
                    heartbeatIntervalRef.current = null
                }

                console.log('Message context SignalR connection stopped')
            } catch (err) {
                console.error('Error stopping connection:', err)
            }
        }
    }, [connection])

    const markAsRead = useCallback((id: string) => {
        if (!isMountedRef.current) return
        setMessages((prev) =>
            prev.filter((notification) => notification.id !== id),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
    }, [])

    const clearAll = useCallback(() => {
        if (!isMountedRef.current) return
        setMessages([])
        setUnreadCount(0)
    }, [])

    const sendCommand = useCallback(
        async (command: string, data?: unknown) => {
            if (
                connection &&
                connection.state === HubConnectionState.Connected
            ) {
                try {
                    await connection.invoke(command, data)
                    console.log(`Command sent: ${command}`, data)
                } catch (error) {
                    console.error(`Error sending command ${command}:`, error)
                    throw error
                }
            } else {
                console.warn('Cannot send command, connection not established')
                throw new Error('Connection not established')
            }
        },
        [connection],
    )

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

    return (
        <MessageContext.Provider value={contextValue}>
            {children}
        </MessageContext.Provider>
    )
}

import {
  HttpTransportType,
  HubConnectionBuilder,
  HubConnectionState,
  type HubConnection,
} from "@microsoft/signalr"
import { useCallback, useEffect, useRef, useState } from "react"

import type { Danmaku } from "../interface/danmaku/type"

const HUB_URL = "/api/danmaku-hub"
const MAX_DANMAKU = 100
const DRAIN_INTERVAL_MS = 1000

export interface UseRealtimeDanmakuReturn {
  connectionState: HubConnectionState
  isJoined: boolean
  danmakuList: Danmaku[]
  startConnection: () => Promise<void>
  stopConnection: () => Promise<void>
  joinRoom: (roomId: number) => Promise<void>
  leaveRoom: (roomId: number) => Promise<void>
  clearDanmaku: () => void
}

export function useRealtimeDanmaku(): UseRealtimeDanmakuReturn {
  const connectionRef = useRef<HubConnection | null>(null)
  const currentRoomIdRef = useRef<number | null>(null)
  const isJoinedRef = useRef<boolean>(false)
  const danmakuQueueRef = useRef<Danmaku[]>([])
  const [connectionState, setConnectionState] = useState<HubConnectionState>(
    HubConnectionState.Disconnected,
  )
  const [isJoined, setIsJoined] = useState<boolean>(false)
  const [danmakuList, setDanmakuList] = useState<Danmaku[]>([])

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (danmakuQueueRef.current.length === 0) return

      const danmakuToAdd = danmakuQueueRef.current.shift()
      if (danmakuToAdd) {
        setDanmakuList((prev) => [danmakuToAdd, ...prev].slice(0, MAX_DANMAKU))
      }
    }, DRAIN_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    return () => {
      connectionRef.current?.stop()
    }
  }, [])

  const clearDanmaku = useCallback(() => {
    danmakuQueueRef.current = []
    setDanmakuList([])
  }, [])

  const buildConnection = useCallback((): HubConnection => {
    const hub = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents,
        timeout: 15000,
        headers: {},
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .build()
    hub.on("ReceiveDanmakus", (danmakuItems: Danmaku[]) => {
      danmakuQueueRef.current = [...danmakuQueueRef.current, ...danmakuItems]
    })

    hub.on("RoomJoined", (message: string) => {
      isJoinedRef.current = true
      setIsJoined(true)
      console.log("User joined:", message)
    })

    hub.on("RoomLeft", (message: string) => {
      console.log("User left:", message)
      isJoinedRef.current = false
      setIsJoined(false)
      clearDanmaku()
    })

    hub.onreconnecting(() => {
      setConnectionState(HubConnectionState.Reconnecting)
    })

    hub.onreconnected(async () => {
      setConnectionState(HubConnectionState.Connected)

      if (isJoinedRef.current && currentRoomIdRef.current !== null) {
        try {
          await hub.invoke("JoinRoom", currentRoomIdRef.current)
        } catch {
          isJoinedRef.current = false
          setIsJoined(false)
        }
      }
    })

    hub.onclose(() => {
      setConnectionState(HubConnectionState.Disconnected)
      isJoinedRef.current = false
      setIsJoined(false)
    })

    return hub
  }, [clearDanmaku])

  const startConnection = useCallback(async () => {
    if (connectionRef.current) return

    const hub = buildConnection()
    connectionRef.current = hub
    setConnectionState(HubConnectionState.Connecting)

    try {
      await hub.start()
      setConnectionState(HubConnectionState.Connected)
    } catch (err) {
      connectionRef.current = null
      setConnectionState(HubConnectionState.Disconnected)
      throw err
    }
  }, [buildConnection])

  const stopConnection = useCallback(async () => {
    const hub = connectionRef.current
    if (!hub) return

    await hub.stop()
    connectionRef.current = null
    currentRoomIdRef.current = null
    clearDanmaku()
    setConnectionState(HubConnectionState.Disconnected)
  }, [clearDanmaku])

  const joinRoom = useCallback(async (roomId: number) => {
    const hub = connectionRef.current
    if (!hub || hub.state !== HubConnectionState.Connected) return
    await hub.invoke("JoinRoom", roomId)
    currentRoomIdRef.current = roomId
  }, [])
  const leaveRoom = useCallback(async (roomId: number) => {
    const hub = connectionRef.current
    if (!hub || hub.state !== HubConnectionState.Connected) return
    await hub.invoke("LeaveRoom", roomId)
    currentRoomIdRef.current = null
  }, [])

  return {
    connectionState,
    isJoined,
    danmakuList,
    startConnection,
    stopConnection,
    joinRoom,
    leaveRoom,
    clearDanmaku,
  }
}

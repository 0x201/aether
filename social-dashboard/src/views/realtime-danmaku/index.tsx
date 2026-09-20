import { HubConnectionState } from "@microsoft/signalr"
import { Button, Input, Card, Space, message } from "antd"
import React, { useState } from "react"

import { DanmakuDisplay } from "@/src/components/DanmakuDisplay"

import "./styles.css"
import { useRealtimeDanmaku } from "@/src/hooks/useRealtimeDnamaku"

const RealtimeDanmakuView: React.FC = () => {
  const [roomId, setRoomId] = useState<number | null>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const {
    connectionState,
    isJoined,
    danmakuList,
    startConnection,
    stopConnection,
    joinRoom,
    leaveRoom,
  } = useRealtimeDanmaku()

  const isConnected = connectionState === HubConnectionState.Connected

  const handleStartConnection = async () => {
    try {
      await startConnection()
      messageApi.success("SignalR Connection Started")
    } catch {
      messageApi.error("SignalR Connection Failed")
    }
  }

  const handleStopConnection = async () => {
    try {
      await stopConnection()
      messageApi.success("SignalR Connection Stopped")
    } catch {
      messageApi.error("SignalR Connection Failed")
    }
  }

  const handleJoinRoom = async () => {
    if (!roomId) {
      messageApi.warning("请输入房间ID")
      return
    }

    if (!isConnected) {
      messageApi.warning("Please start a connection first")
      return
    }

    try {
      await joinRoom(roomId)
      messageApi.success(`Joined room: ${roomId}`)
    } catch (error) {
      messageApi.error("Failed to join room")
    }
  }

  const handleLeaveRoom = async () => {
    if (!isConnected) {
      messageApi.warning("Please start a connection first")
      return
    }

    try {
      await leaveRoom(roomId!)
      messageApi.success(`Left room: ${roomId}`)
      setRoomId(null)
    } catch {
      messageApi.error("Failed to leave room")
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      {contextHolder}
      <Card title="实时弹幕" style={{ marginBottom: "20px" }}>
        <Space wrap>
          <Button
            type={isConnected ? "default" : "primary"}
            onClick={handleStartConnection}
            disabled={isConnected}
          >
            建立连接
          </Button>
          <Button
            type={isConnected ? "primary" : "default"}
            onClick={handleStopConnection}
            disabled={!isConnected}
            danger
          >
            断开连接
          </Button>
          <Input
            placeholder="房间ID"
            value={roomId ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = Number(e.target.value)
              setRoomId(Number.isNaN(val) || e.target.value === "" ? null : val)
            }}
            style={{ width: "200px" }}
          />
          <Button
            onClick={handleJoinRoom}
            disabled={!isConnected || isJoined || !roomId}
            color="cyan"
            variant="solid"
          >
            加入房间
          </Button>
          <Button
            onClick={handleLeaveRoom}
            disabled={!isConnected || !isJoined}
            color="red"
            variant="solid"
          >
            离开房间
          </Button>
        </Space>
      </Card>

      <div className="danmaku-display-container">
        <DanmakuDisplay danmakuList={danmakuList} autoScroll={true} />
      </div>
    </div>
  )
}

export default RealtimeDanmakuView

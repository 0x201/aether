import React, { useEffect, useRef, useState } from 'react';
import { HttpTransportType, HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Button, Input, Card, Space, message } from 'antd';
import DanmakuDisplay from '@/src/components/DanmakuDisplay';
import type { Danmaku } from '@/src/interface/Danmaku';
import config from '@/src/config';

import "./RealtimeDanmakuView.css";

const RealtimeDanmakuView: React.FC = () => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [danmakuList, setDanmakuList] = useState<Danmaku[]>([]);
  const danmakuQueueRef = useRef<Danmaku[]>([]); // Queue to store incoming danmaku
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { apiBaseUrl } = config;

  // Function to process danmaku queue one by one at regular intervals
  useEffect(() => {
    // Set up an interval to process the queue every 100ms
    const intervalId = setInterval(() => {
      if (danmakuQueueRef.current.length > 0) {
        // Get the first item from the queue
        const danmakuToAdd = danmakuQueueRef.current.shift();
        if (danmakuToAdd) {
          setDanmakuList(prev => {
            // Add the new danmaku to the front of the list and keep only the most recent 100
            const updatedList = [danmakuToAdd, ...prev];
            return updatedList.slice(0, 100);
          });
        }
      }
    }, 100); // Process one danmaku every 100ms

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []); // Only run once on component mount

  const startHubConnection = async () => {
    if (!connection) {
      // Rebuild connection if stopped
      const hubConnection = new HubConnectionBuilder()
        .withUrl(`/api/danmaku-hub`,
          HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents
        )
        .withAutomaticReconnect()
        .build();

      hubConnection.on('ReceiveNewDanmaku', (danmakuItems: Danmaku[]) => {
        // Add new danmaku to the queue instead of directly to the list
        danmakuQueueRef.current = [...danmakuQueueRef.current, ...danmakuItems];
      });

      hubConnection.on('RoomJoined', (message: string) => {
        console.log('User joined:', message);
      });

      hubConnection.on('RoomLeft', (message: string) => {
        console.log('User left:', message);
        setDanmakuList([]);
        danmakuQueueRef.current = []; // Clear the queue as well
      });

      hubConnection.start()
        .then(() => {
          setConnection(hubConnection);
          messageApi.success('SignalR Connection Started');
        })
        .catch(error => {
          console.error('Error starting connection:', error);
          messageApi.error('SignalR Connection Failed');
        });
    }
  }

  useEffect(() => {
    // Clean up connection on component unmount
    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [connection]);

  const stopConnection = async () => {
    try {
      if (connection) {
        await connection.stop();
        setConnection(null);
        setDanmakuList([]);
        danmakuQueueRef.current = []; // Clear the queue as well
        messageApi.success('SignalR Connection Stopped');
      }
    } catch (error) {
      console.error('Error stopping connection:', error);
      messageApi.error('Failed to stop connection');
    }
  };

  const joinRoom = async () => {
    if (!roomId) {
      messageApi.warning('请输入房间ID');
      return;
    }
    if (connection && connection.state === HubConnectionState.Connected) {
      try {
        await connection.invoke('JoinRoom', roomId);
        messageApi.success(`Joined room: ${roomId}`);
        setIsJoined(true);
      } catch (error) {
        console.error('Error joining room:', error);
        messageApi.error('Failed to join room');
      }
    } else {
      messageApi.warning('Please start a connection first');
    }
  };

  const leaveRoom = async () => {
    if (connection && connection.state === HubConnectionState.Connected) {
      try {
        await connection.invoke('LeaveRoom', roomId);
        setDanmakuList([]);
        danmakuQueueRef.current = []; // Clear the queue as well
        messageApi.success(`Left room: ${roomId}`);
        setIsJoined(false);
        setRoomId(null);
      } catch (error) {
        console.error('Error leaving room:', error);
        messageApi.error('Failed to leave room');
      }
    } else {
      messageApi.warning('Please start a connection first');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {contextHolder}
      <Card title="实时弹幕" style={{ marginBottom: '20px' }}>
        <Space wrap>
          <Button
            type={connection ? 'default' : 'primary'}
            onClick={startHubConnection}
            disabled={!!connection}
          >
            建立连接
          </Button>
          <Button
            type={connection ? 'primary' : 'default'}
            onClick={stopConnection}
            disabled={!connection}
            danger
          >
            断开连接
          </Button>
          <Input
            placeholder="房间ID"
            value={roomId!}
            onChange={(e) => setRoomId(Number(e.target.value))}
            style={{ width: '200px' }}
          />
          <Button onClick={joinRoom} disabled={!connection || isJoined || !roomId} color='cyan' variant='solid'>加入房间</Button>
          <Button onClick={leaveRoom} disabled={!connection || !isJoined} color='red' variant='solid'>离开房间</Button>
        </Space>
      </Card>

      <div title="弹幕显示" className='danmaku-display-container'>
        <DanmakuDisplay
          danmakuList={danmakuList}
          autoScroll={true}
        />
      </div>
    </div>
  );
};

export default RealtimeDanmakuView;
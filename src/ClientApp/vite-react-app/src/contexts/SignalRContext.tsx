import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

interface SignalRContextType {
  connection: HubConnection | null;
  isConnected: boolean;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

interface SignalRProviderProps {
  children: ReactNode;
}

export const SignalRProvider: React.FC<SignalRProviderProps> = ({ children }) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5205/jobstatus')
      .configureLogging(LogLevel.Information)
      .build();

    setConnection(newConnection);

    newConnection.start()
      .then(() => {
        console.log('SignalR Connected');
        setIsConnected(true);
      })
      .catch(err => {
        console.error('SignalR Connection Error: ', err);
        setIsConnected(false);
      });

    return () => {
      if (newConnection) {
        newConnection.stop()
          .then(() => console.log('SignalR Disconnected'))
          .catch(err => console.error('Error disconnecting SignalR: ', err));
      }
    };
  }, []);

  return (
    <SignalRContext.Provider value={{ connection, isConnected }}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = (): SignalRContextType => {
  const context = useContext(SignalRContext);
  if (context === undefined) {
    throw new Error('useSignalR must be used within a SignalRProvider');
  }
  return context;
};
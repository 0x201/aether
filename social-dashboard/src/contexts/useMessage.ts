import type { HubConnection } from '@microsoft/signalr'
import { createContext, useContext } from 'react'
import type { Message } from '../interface/Message'

export interface MessageContextType {
  messages: Message[]
  unreadCount: number
  connection: HubConnection | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  markAsRead: (id: string) => void
  clearAll: () => void
  sendCommand: (command: string, data?: unknown) => Promise<void>
}

const MessageContext = createContext<MessageContextType | undefined>(undefined)

export const useMessage = (): MessageContextType => {
  const context = useContext(MessageContext)
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider')
  }
  return context
}

export { MessageContext }

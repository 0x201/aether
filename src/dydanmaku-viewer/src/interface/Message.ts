export interface AnalyticsMessage {
  id: string;
  completedAt: string;
  roomId: string;
  frequenciesCount: number;
  startDate: string;
  endDate: string;
  periodType: string;
}

export interface DanmakuMessage {
  id: string;
  roomId: string;
  content: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface SystemMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

export type Message = AnalyticsMessage | DanmakuMessage | SystemMessage;
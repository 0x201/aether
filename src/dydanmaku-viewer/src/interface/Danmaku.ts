export interface Danmaku {
  id: string
  userId: string
  userName: string
  content: string
  fanMedalName?: string
  fanMedalLevel?: number
  userLevel?: number
  roomId?: string
  roomName?: string
  createdAt: string
}

export interface Room {
  roomId: number
  anchorName: string
}

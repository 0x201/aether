export interface Danmaku {
  id: number
  userId: string
  userName: string
  content: string
  fanMedalName?: string
  fanMedalLevel?: number
  userLevel?: number
  roomId?: number
  roomName?: string
  createdAt: string
}

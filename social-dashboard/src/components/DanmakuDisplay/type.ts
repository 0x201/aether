import type { Danmaku } from "@/src/interface/danmaku/type"

export interface DanmakuDisplayProps {
  danmakuList: Danmaku[]
  autoScroll?: boolean
}

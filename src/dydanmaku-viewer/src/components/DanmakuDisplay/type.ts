import type { Danmaku } from '@/src/interface/Danmaku'

export interface DanmakuDisplayProps {
    danmakuList: Danmaku[]
    autoScroll?: boolean
}

export interface TopUser {
    userName: string
    count: number
}

export interface TopRoom {
    roomId: number
    roomName: string
    count: number
}

export interface DanmakuStats {
    totalCount: number
    uniqueUsers: number
    topUsers: TopUser[]
    topRooms: TopRoom[]
    hourlyDistributions: HourlyDistribution[]
}

export interface HourlyDistribution {
    hour: number
    count: number
}

export interface DanmakuStatsResponse {
    data: DanmakuStats
    message: string
    status: number
}

export interface DateRange {
    startTime?: string
    endTime?: string
}

export interface WordFreqResponse {
    data: WordFreq[]
    message: string
    status: number
}

export interface WordFreq {
    word: string
    count: number
}

export interface DashboardData {
    stats: DanmakuStats | null
    wordFreqs: WordFreq[] | null
    loading: boolean
    loadingWordFreq: boolean
    loadingWordcloud: boolean
    error: string | null
}

export interface DashboardActions {
    setDateRange: (range: DateRange) => void
    refreshData: () => void
}

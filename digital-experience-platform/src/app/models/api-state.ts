export interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  timestamp: number
}

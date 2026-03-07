export interface TransformedDataItem {
  name: string;
  value: number;
  tooltipContent?: string;
}

export interface DanmakuChartProps<T> {
  data: T[];
  transformFunction: (data: T[]) => TransformedDataItem[];
  title: string;
  color: string;
  loading: boolean;
  angle?: number;
}

import { Card, Spin } from 'antd'
import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '@/src/contexts/useTheme'
import { m } from "@/src/i18n";

export interface TransformedDataItem {
  name: string
  value: number
  tooltipContent?: string
}

export interface DanmakuChartProps<T> {
  data: T[]
  transformFunction: (data: T[]) => TransformedDataItem[]
  title: string
  color: string
  loading: boolean
  angle?: number
  xAxisLabel?: string
  yAxisLabel?: string
}


const DanmakuChart = <T,>({
  data,
  transformFunction,
  title,
  color,
  loading,
  angle = 0,
}: DanmakuChartProps<T>) => {
  const transformedData = useMemo(() => transformFunction(data || []), [data, transformFunction])
  const theme = useTheme()
  const bgColor = theme.currentTheme === 'dark' ? '#3e3d3d' : '#fff'

  return (
    <Card title={title} style={{ height: '100%' }}>
      <div style={{ height: 500, width: '100%' }}>
        {!loading && data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" debounce={150}>
            <BarChart data={transformedData} barSize={30} responsive>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={angle}
                textAnchor="end"
                tickMargin={25}
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip contentStyle={{ background: bgColor }} />
              <Legend verticalAlign="top" layout="horizontal" />
              <Bar dataKey="value" name={m.danmaku_chart_bar_label()} fill={color} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            {loading && <Spin size="large" />}
            {!loading && (!data || data.length === 0) && <p>{m.danmaku_chart_no_data()}</p>}
          </div>
        )}
      </div>
    </Card>
  )
}

export { DanmakuChart }

export default DanmakuChart

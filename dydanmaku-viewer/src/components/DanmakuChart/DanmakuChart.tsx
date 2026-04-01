import { Card, Spin } from 'antd'
import React from 'react'
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
import type { DanmakuChartProps } from './type'

const DanmakuChart = <T,>({
  data,
  transformFunction,
  title,
  color,
  loading,
  angle = 0,
}: DanmakuChartProps<T>) => {
  const transformedData = useMemo(() => transformFunction(data || []), [data, transformFunction])

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
              <Tooltip
                contentStyle={{
                  background: '#3e3d3d',
                }}
              />
              <Legend verticalAlign="top" layout="horizontal" />
              <Bar dataKey="value" name="弹幕数量" fill={color} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            {loading && <Spin size="large" />}
            {!loading && (!data || data.length === 0) && <p>暂无数据</p>}
          </div>
        )}
      </div>
    </Card>
  )
}

export default React.memo(DanmakuChart) as typeof DanmakuChart

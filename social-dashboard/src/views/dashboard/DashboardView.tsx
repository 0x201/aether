import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, Row, Col, Statistic, Spin, DatePicker, Typography, message, Select } from 'antd'
import WordCloud from '@/src/components/Wordcloud'
import { colormapOptions } from '@/src/components/Wordcloud/type'
import { useDashboardData } from './useDashboardData'
import type { HourlyDistribution, TopRoom, TopUser, WordFreq } from './type'
import type { Room } from '@/src/interface/room/type'
import './Dashboard.css'
import type { Dayjs } from 'dayjs'
import { DanmakuChart, type TransformedDataItem } from '@/src/components/DanmakuChart'

const { Title } = Typography
const { Meta } = Card
const { RangePicker } = DatePicker

const Dashboard: React.FC = () => {
  const { data, actions } = useDashboardData()
  const { stats, wordFreqs, loading, loadingWordcloud, error } = data
  const { setDateRange, handleRoomChange, fetchRooms, selectedRoomId } = actions
  const [messageApi, contextHolder] = message.useMessage()
  const [allRooms, setAllRooms] = useState<Room[]>([])
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')
  const [selectedColormap, setSelectedColormap] = useState<
    'viridis' | 'plasma' | 'inferno' | 'magma' | 'cividis' | 'rainbow'
  >('viridis')

  const loadRooms = useCallback(
    async (search?: string) => {
      setLoadingRooms(true)
      try {
        const { data } = await fetchRooms(1, 20, search)
        const noRoomOption: Room = {
          id: -1,
          roomId: -1,
          roomName: '全部房间',
          createdAt: '',
        }
        setAllRooms([noRoomOption, ...data])
      } catch (err) {
        console.error('加载房间列表失败:', err)
        setAllRooms([])
      } finally {
        setLoadingRooms(false)
      }
    },
    [fetchRooms],
  )

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  const handleDateChange = useCallback(
    (dates: (Dayjs | null)[] | null) => {
      if (dates && dates[0] && dates[1]) {
        const startTime = dates[0].toISOString()
        const endTime = dates[1].toISOString()

        setDateRange({
          startTime: startTime,
          endTime: endTime,
        })
      } else {
        setDateRange({})
      }
    },
    [setDateRange],
  )

  const handleRoomChangeSelect = useCallback(
    (value: number | null) => {
      handleRoomChange(value)
    },
    [handleRoomChange],
  )

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      if (value) {
        setTimeout(() => {
          if (value === searchValue) {
            loadRooms(value)
          }
        }, 300)
      } else {
        loadRooms()
      }
    },
    [searchValue, loadRooms],
  )

  useEffect(() => {
    if (error) {
      messageApi.error(error)
    }
  }, [error, messageApi])

  const transformHourlyData = useCallback((data: HourlyDistribution[]): TransformedDataItem[] => {
    return data.map((item) => ({
      name: `${item.hour}`,
      value: item.count,
    }))
  }, [])

  const transformUserData = useCallback((data: TopUser[]): TransformedDataItem[] => {
    return data.map((item) => ({
      name: item.userName,
      value: item.count,
    }))
  }, [])

  const transformRoomData = useCallback((data: TopRoom[]): TransformedDataItem[] => {
    return data.map((item) => ({
      name: item.roomName,
      value: item.count,
    }))
  }, [])

  const transformWordFreqData = useCallback((data: WordFreq[]): TransformedDataItem[] => {
    return data.map((item) => ({
      name: item.word,
      value: item.count,
    }))
  }, [])

  const chartComponents = useMemo(
    () => ({
      hourlyDistribution: (
        <DanmakuChart
          key="hourly-distribution"
          data={stats?.hourlyDistributions || []}
          transformFunction={transformHourlyData}
          title="弹幕时段分布图"
          color="var(--total-count-color)"
          loading={loading}
          angle={0}
        />
      ),
      topUsers: (
        <DanmakuChart
          key="top-users"
          data={stats?.topUsers || []}
          transformFunction={transformUserData}
          title="Top 20 用户弹幕数"
          color="var(--unique-users-color)"
          loading={loading}
          angle={-45}
        />
      ),
      topRooms: (
        <DanmakuChart
          key="top-rooms"
          data={stats?.topRooms || []}
          transformFunction={transformRoomData}
          title="Top 20 房间弹幕数"
          color="var(--top-users-color)"
          loading={loading}
          angle={-45}
        />
      ),
      wordFreq: (
        <DanmakuChart
          key="word-freq"
          data={wordFreqs?.slice(0, 20) || []}
          transformFunction={transformWordFreqData}
          title="词频统计Top20"
          color="var(--top-rooms-color)"
          loading={loading}
          angle={-45}
        />
      ),
    }),
    [
      stats?.hourlyDistributions,
      stats?.topUsers,
      stats?.topRooms,
      wordFreqs,
      transformHourlyData,
      transformUserData,
      transformRoomData,
      transformWordFreqData,
      loading,
    ],
  )

  const statCards = useMemo(
    () => (
      <>
        {/* Stats Cards */}
        <Col xs={24} sm={24} md={12} lg={6} xl={6}>
          <Card className="stat-card-total-count">
            <Meta title="弹幕总数" description={<Statistic value={stats?.totalCount} />} />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12} lg={6} xl={6}>
          <Card className="stat-card-unique-users">
            <Meta title="用户数" description={<Statistic value={stats?.uniqueUsers} />} />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12} lg={6} xl={6}>
          <Card className="stat-card-top-users">
            <Meta
              title="最活跃用户"
              description={
                <Statistic
                  value={stats?.topUsers.length ? stats.topUsers[0].count : 'N/A'}
                  prefix={
                    stats?.topUsers.length && stats.topUsers[0].userName
                      ? `@${stats.topUsers[0].userName}`
                      : 'N/A'
                  }
                />
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12} lg={6} xl={6}>
          <Card className="stat-card-top-rooms">
            <Meta
              title="最活跃直播间"
              description={
                <Statistic
                  value={stats?.topRooms.length ? stats.topRooms[0].count : 'N/A'}
                  prefix={
                    stats?.topRooms.length && stats.topRooms[0].roomName
                      ? `@${stats.topRooms[0].roomName}`
                      : 'N/A'
                  }
                />
              }
            />
          </Card>
        </Col>
      </>
    ),
    [stats],
  )

  return (
    <div className="dashboard-container">
      {contextHolder}

      <Row gutter={16}>
        <Col span={24}>
          <Title level={4} style={{ textAlign: 'center' }}>
            弹幕数据仪表板
          </Title>
        </Col>
        <Col span={24}>
          <Row style={{ marginBottom: '20px' }}>
            <Col xs={24} sm={24} md={12} lg={8} xl={6}>
              <span style={{ marginRight: 8 }}>选择时间：</span>
              <RangePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder={['开始时间', '结束时间']}
                onChange={handleDateChange}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={8} xl={6}>
              <span style={{ marginRight: 8 }}>选择房间：</span>
              <Select
                className="room-select-container"
                placeholder="搜索并选择房间"
                value={selectedRoomId === -1 ? -1 : selectedRoomId}
                onChange={handleRoomChangeSelect}
                showSearch={{
                  onSearch: handleSearch,
                  filterOption: false,
                }}
                loading={loadingRooms}
                options={allRooms.map((room) => ({
                  label: `${room.roomName}`,
                  value: room.roomId,
                }))}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
        </Col>

        {loading && (
          <Col span={24} style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <p>正在加载数据...</p>
          </Col>
        )}

        {!loading && stats && statCards}
      </Row>

      <Row gutter={16} style={{ marginTop: '20px' }}>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          {chartComponents.hourlyDistribution}
        </Col>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          {chartComponents.topUsers}
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: '20px' }}>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          {chartComponents.topRooms}
        </Col>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          {chartComponents.wordFreq}
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: '20px' }}>
        <Col span={24}>
          <Card
            title="词云图"
            extra={
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  width: '16em',
                }}
              >
                <span style={{ width: '100%' }}>选择配色方案：</span>
                <Select
                  value={selectedColormap}
                  onChange={(e) => setSelectedColormap(e)}
                  style={{ width: '100%' }}
                  options={colormapOptions}
                />
              </div>
            }
          >
            <div>
              {loadingWordcloud ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 0',
                  }}
                >
                  <Spin size="large" />
                  <p>正在生成词云...</p>
                </div>
              ) : wordFreqs && wordFreqs.length > 0 ? (
                <WordCloud
                  words={wordFreqs.map((wf) => ({
                    text: wf.word,
                    size: wf.count,
                  }))}
                  colormap={selectedColormap}
                />
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 0',
                  }}
                >
                  <p>暂无词云数据</p>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default React.memo(Dashboard)

import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Spin, DatePicker, Typography, message, Select } from 'antd';
import WordCloud from '@/src/components/Wordcloud';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { colormapOptions } from '@/src/components/Wordcloud/type';
import { useDashboardData } from './useDashboardData';
import type { HourlyDistribution, Room, TopRoom, TopUser, WordFreq } from './type';
import './Dashboard.css';
import type { Dayjs } from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;


const CustomTooltip = React.memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const tooltipContent = payload[0]?.payload?.tooltipContent;

    if (!tooltipContent || typeof tooltipContent !== 'string') {
      return null;
    }

    return (
      <div>
        <p>{tooltipContent}</p>
      </div>
    );
  }

  return null;
});

const Dashboard: React.FC = () => {
  const { data, actions } = useDashboardData();
  const {
    stats,
    wordFreqs,
    loading,
    loadingWordcloud,
    error,
  } = data;
  const { setDateRange, handleRoomChange, fetchRooms, selectedRoomId } = actions;
  const [messageApi, contextHolder] = message.useMessage();
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');
  // State for colormap selection
  const [selectedColormap, setSelectedColormap] = useState<'viridis' | 'plasma' | 'inferno' | 'magma' | 'cividis' | 'rainbow'>('viridis');

  const loadRooms = async (search?: string) => {
    setLoadingRooms(true);
    try {
      const { data } = await fetchRooms(1, 20, search);
      const noRoomOption: Room = { roomId: -1, anchorName: '全部房间' }; // 使用 -1 作为特殊值代替 null
      setAllRooms([noRoomOption, ...data]);
    } catch (err) {
      console.error('加载房间列表失败:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleDateChange = (dates: (Dayjs | null)[] | null, _dateStrings: string[]) => {
    if (dates && dates[0] && dates[1]) {
      const startTime = dates[0].toISOString();
      const endTime = dates[1].toISOString();

      setDateRange({
        startTime: startTime,
        endTime: endTime
      });
    } else {
      setDateRange({});
    }
  };

  const handleRoomChangeSelect = (value: number | null) => {
    handleRoomChange(value);
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (value) {
      setTimeout(() => {
        if (value === searchValue) {
          loadRooms(value);
        }
      }, 300);
    } else {
      loadRooms();
    }
  };

  useEffect(() => {
    if (error) {
      messageApi.error(error);
    }
  }, [error, messageApi]);

  const HourlyDistributionChart = useMemo(() => (
    <ChartComponent
      data={data.stats?.hourlyDistributions}
      transformFunction={transformHourlyData}
      title="弹幕时段分布图"
      color="#8884d8"
      loading={loading}
    />
  ), [data.stats?.hourlyDistributions, loading]);

  const TopUsersChart = useMemo(() => (
    <ChartComponent
      data={data.stats?.topUsers}
      transformFunction={transformUserData}
      title="Top 用户弹幕数"
      color="#82ca9d"
      loading={loading}
    />
  ), [data.stats?.topUsers, loading]);

  const TopRoomsChart = useMemo(() => (
    <ChartComponent
      data={data.stats?.topRooms}
      transformFunction={transformRoomData}
      title="Top 房间弹幕数"
      color="#ffc658"
      loading={loading}
    />
  ), [data.stats?.topRooms, loading]);

  const WordFreqChart = useMemo(() => (
    <ChartComponent
      data={data.wordFreqs}
      transformFunction={transformWordFreqData}
      title="词频统计"
      color="#ff7e5f"
      loading={loading}
    />
  ), [data.wordFreqs, loading]);

  return (
    <div className="dashboard-container">
      {contextHolder}

      <Row gutter={16}>
        <Col span={24}>
          <Title level={4} style={{ textAlign: 'center' }}>弹幕数据仪表板</Title>
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
                showSearch={{ onSearch: handleSearch, filterOption: false }}
                loading={loadingRooms}
                options={allRooms.map(room => ({
                  label: `${room.anchorName}`,
                  value: room.roomId
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

        {!loading && stats && (
          <>
            {/* Stats Cards */}
            <Col xs={24} sm={24} md={12} lg={6} xl={6}>
              <Card>
                <Statistic
                  title="弹幕总数"
                  value={stats.totalCount}
                  styles={{ content: { color: '#3f8600' } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={24} md={12} lg={6} xl={6}>
              <Card>
                <Statistic
                  title="用户数"
                  value={stats.uniqueUsers}
                  styles={{ content: { color: '#3f8600' } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={24} md={12} lg={6} xl={6}>
              <Card>
                <Statistic
                  title="最活跃用户"
                  value={stats.topUsers.length > 0 ? stats.topUsers[0].count : 'N/A'}
                  prefix={stats.topUsers.length > 0 && stats.topUsers[0].userName ? `@${stats.topUsers[0].userName}` : 'N/A'}
                  styles={{ content: { color: '#3f8600' } }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={24} md={12} lg={6} xl={6}>
              <Card>
                <Statistic
                  title="最活跃直播间"
                  value={stats.topRooms.length > 0 ? stats.topRooms[0].count : 'N/A'}
                  prefix={stats.topRooms.length > 0 && stats.topRooms[0].roomName ? `@${stats.topRooms[0].roomName}` : 'N/A'}
                  styles={{ content: { color: '#3f8600' } }}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>

      <Row gutter={16} style={{ marginTop: '20px' }}>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          {HourlyDistributionChart}
        </Col>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          {TopUsersChart}
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: '20px' }}>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          {TopRoomsChart}
        </Col>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          {WordFreqChart}
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: '20px' }}>
        <Col span={24}>
          <Card title="词云图" extra={
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: "16em" }}>
              <span style={{ width: "100%" }}>选择配色方案：</span>
              <Select
                value={selectedColormap}
                onChange={(e) => setSelectedColormap(e)}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d9d9d9', width: "100%" }}
                options={colormapOptions}
              />
            </div>
          }>
            <div>
              {loadingWordcloud ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin size="large" />
                  <p>正在生成词云...</p>
                </div>
              ) : wordFreqs && wordFreqs.length > 0 ? (
                <WordCloud words={wordFreqs.map(wf => ({ text: wf.word, size: wf.count }))} colormap={selectedColormap} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p>暂无词云数据</p>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const ChartComponent = React.memo(({
  data,
  transformFunction,
  title,
  color,
  loading
}: {
  data: any;
  transformFunction: (data: any) => any;
  title: string;
  color: string;
  loading: boolean;
}) => {
  const transformedData = transformFunction(data || []);

  return (
    <Card title={title} style={{ height: '100%' }}>
      <div style={{ height: 400 }}>
        {!loading && data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300} minHeight={300} debounce={150}>
            <ReBarChart
              data={transformedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip content={CustomTooltip} contentStyle={{ color: color }} />
              <Legend verticalAlign="top" layout="horizontal" />
              <Bar dataKey="value" name="弹幕数量" fill={color} />
            </ReBarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            {loading && <Spin />}
            {!loading && (!data || data.length === 0) && <p>暂无数据</p>}
          </div>
        )}
      </div>
    </Card>
  );
});

const transformHourlyData = (data: HourlyDistribution[]) => {
  return data.map(item => ({
    name: `${item.hour}`,
    value: item.count,
    tooltipContent: `小时: ${item.hour}<br/>数量: ${item.count}`
  }));
};

const transformUserData = (data: TopUser[]) => {
  return data.map(item => ({
    name: item.userName,
    value: item.count,
    tooltipContent: `用户名: ${item.userName}<br/>数量: ${item.count}`
  }));
};

const transformRoomData = (data: TopRoom[]) => {
  return data.map(item => ({
    name: item.roomName,
    value: item.count,
    tooltipContent: `房间名: ${item.roomName}<br/>数量: ${item.count}`
  }));
};

const transformWordFreqData = (data: WordFreq[]) => {
  return data.map(item => ({
    name: item.word,
    value: item.count,
    tooltipContent: `词语: ${item.word}<br/>频次: ${item.count}`
  }));
};

export default React.memo(Dashboard);
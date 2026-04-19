import React, { useCallback, useMemo, useState } from "react";
import { Card, Row, Col, Statistic, Spin, DatePicker, Typography, message, Select } from "antd";
import WordCloud from "@/src/components/Wordcloud";
import { colormapOptions } from "@/src/components/Wordcloud/type";
import { useDashboardData } from "../../hooks/useDashboardData";
import type { HourlyDistribution, TopRoom, TopUser, WordFreq } from "./type";
import type { RoomOption } from "@/src/interface/room/type";
import "./styles.css";
import type { Dayjs } from "dayjs";
import { DanmakuChart, type TransformedDataItem } from "@/src/components/DanmakuChart";
import InfiniteRefreshSelect from "@/src/components/InfiniteRefreshSelect";

const { Title } = Typography;
const { Meta } = Card;
const { RangePicker } = DatePicker;

const Dashboard: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedColormap, setSelectedColormap] = useState<
    "viridis" | "plasma" | "inferno" | "magma" | "cividis" | "rainbow"
  >("viridis");

  const { state, actions } = useDashboardData({ messageApi, defaultHours: 1 });

  const { stats, wordFreqs, loading, loadingStats, loadingWordFreq, error } = state;
  const { setDateRange, handleRoomChange, fetchRoomOptions, selectedRoomId } = actions;

  React.useEffect(() => {
    if (error) {
      messageApi.error(error);
    }
  }, [error, messageApi]);

  const handleDateChange = useCallback(
    (dates: [Dayjs | null, Dayjs | null] | null) => {
      if (dates && dates[0] && dates[1]) {
        setDateRange({
          startTime: dates[0].toISOString(),
          endTime: dates[1].toISOString(),
        });
      } else {
        setDateRange({});
      }
    },
    [setDateRange],
  );

  const handleRoomChangeSelect = useCallback(
    (value: string | RoomOption) => {
      const roomId = typeof value === "object" ? Number(value.value) : Number(value);
      handleRoomChange(isNaN(roomId) ? null : roomId);
    },
    [handleRoomChange],
  );

  const transformHourlyData = useCallback(
    (data: HourlyDistribution[]): TransformedDataItem[] =>
      data.map((item) => ({ name: `${item.hour}`, value: item.count })),
    [],
  );

  const transformUserData = useCallback(
    (data: TopUser[]): TransformedDataItem[] =>
      data.map((item) => ({ name: item.userName, value: item.count })),
    [],
  );

  const transformRoomData = useCallback(
    (data: TopRoom[]): TransformedDataItem[] =>
      data.map((item) => ({ name: item.roomName, value: item.count })),
    [],
  );

  const transformWordFreqData = useCallback(
    (data: WordFreq[]): TransformedDataItem[] =>
      data.map((item) => ({ name: item.word, value: item.count })),
    [],
  );

  const chartComponents = useMemo(
    () => ({
      hourlyDistribution: (
        <DanmakuChart
          key="hourly-distribution"
          data={stats?.hourlyDistributions || []}
          transformFunction={transformHourlyData}
          title="弹幕时段分布图"
          color="var(--total-count-color)"
          loading={loadingStats}
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
          loading={loadingStats}
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
          loading={loadingStats}
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
          loading={loadingWordFreq}
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
      loadingStats,
      loadingWordFreq,
    ],
  );

  const statCards = useMemo(
    () => (
      <>
        <Col xs={24} sm={24} md={12} lg={6} xl={6}>
          <Card className="stat-card-total-count">
            <Meta title="弹幕总数" description={<Statistic value={stats?.totalCount ?? 0} />} />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12} lg={6} xl={6}>
          <Card className="stat-card-unique-users">
            <Meta title="用户数" description={<Statistic value={stats?.uniqueUsers ?? 0} />} />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12} lg={6} xl={6}>
          <Card className="stat-card-top-users">
            <Meta
              title="最活跃用户"
              description={
                <Statistic
                  value={stats?.topUsers?.[0]?.count ?? "N/A"}
                  prefix={stats?.topUsers?.[0]?.userName ? `@${stats.topUsers[0].userName}` : "N/A"}
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
                  value={stats?.topRooms?.[0]?.count ?? "N/A"}
                  prefix={stats?.topRooms?.[0]?.roomName ? `@${stats.topRooms[0].roomName}` : "N/A"}
                />
              }
            />
          </Card>
        </Col>
      </>
    ),
    [stats],
  );

  return (
    <div className="dashboard-container">
      {contextHolder}

      <Row gutter={16}>
        <Col span={24}>
          <Title level={4} style={{ textAlign: "center" }}>
            弹幕数据仪表板
          </Title>
        </Col>
        <Col span={24}>
          <Row style={{ marginBottom: "20px" }} gutter={[16, 16]}>
            <Col xs={24} sm={24} md={12} lg={8} xl={6}>
              <span style={{ marginRight: 8 }}>选择时间：</span>
              <RangePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder={["开始时间", "结束时间"]}
                onChange={handleDateChange}
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={8} xl={6}>
              <span style={{ marginRight: 8 }}>选择房间：</span>
              <InfiniteRefreshSelect<RoomOption>
                fetchOptions={fetchRoomOptions}
                placeholder="请输入房间ID或主播名"
                debounceTimeout={300}
                pageSize={10}
                value={
                  selectedRoomId && selectedRoomId !== -1
                    ? {
                        value: selectedRoomId.toString(),
                        label: `房间ID: ${selectedRoomId}`,
                      }
                    : undefined
                }
                onChange={handleRoomChangeSelect}
                allowClear
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} sm={24} md={24} lg={8} xl={12} style={{ textAlign: "right" }}>
              {/* 可以添加刷新按钮 */}
            </Col>
          </Row>
        </Col>

        {loading && (
          <Col span={24} style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
            <p>正在加载数据...</p>
          </Col>
        )}

        {!loading && stats && statCards}
      </Row>

      <Row gutter={16} style={{ marginTop: "20px" }}>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          {chartComponents.hourlyDistribution}
        </Col>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          {chartComponents.topUsers}
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: "20px" }}>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          {chartComponents.topRooms}
        </Col>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          {chartComponents.wordFreq}
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: "20px" }}>
        <Col span={24}>
          <Card
            title="词云图"
            extra={
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  width: "16em",
                }}
              >
                <span style={{ width: "100%" }}>选择配色方案：</span>
                <Select
                  value={selectedColormap}
                  onChange={setSelectedColormap}
                  style={{ width: "100%" }}
                  options={colormapOptions}
                />
              </div>
            }
          >
            <div>
              {loadingWordFreq ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
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
                <div style={{ textAlign: "center", padding: "40px 0" }}>
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

export default Dashboard;

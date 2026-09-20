import {
  BulbOutlined,
  CodeOutlined,
  RocketOutlined,
  BarChartOutlined,
  CloudDownloadOutlined,
  HeatMapOutlined,
  DatabaseOutlined,
  ApiOutlined,
  ClusterOutlined,
  InteractionOutlined,
  ScheduleOutlined,
  LineChartOutlined,
} from "@ant-design/icons"
import { Card, Typography, Divider, Row, Col, Button, Space } from "antd"
import React from "react"

import "./styles.css"

const { Title, Paragraph } = Typography
const { Meta } = Card
const HomeView: React.FC = () => {
  const features = [
    {
      title: "弹幕捕获",
      description: "实时捕获指定斗鱼房间的弹幕消息，基于WebSocket实现高并发捕获",
      icon: <RocketOutlined className="feature-icon" />,
    },
    {
      title: "弹幕管理",
      description: "提供丰富功能的弹幕管理表格，可以查看、编辑和删除已捕获的弹幕数据",
      icon: <BulbOutlined className="feature-icon" />,
    },
    {
      title: "数据统计分析",
      description: "统计弹幕总数、唯一用户数、最活跃用户、时段分布等",
      icon: <BarChartOutlined className="feature-icon" />,
    },
    {
      title: "词频分析",
      description: "分析弹幕中的高频词汇，支持自动生成词频统计和词云图",
      icon: <CloudDownloadOutlined className="feature-icon" />,
    },
    {
      title: "可视化图表",
      description: "生成弹幕时间分布、最活跃用户Top20、词频Top20等",
      icon: <HeatMapOutlined className="feature-icon" />,
    },
    {
      title: "定时任务捕获",
      description: "支持配置定时任务，按计划自动捕获指定房间的弹幕数据",
      icon: <CodeOutlined className="feature-icon" />,
    },
  ]

  const techStack = [
    {
      title: "后端技术栈",
      description: "Asp.NET Core Web API + EntityFrameworkCore + PostgreSQL + SignalR",
      icon: <ApiOutlined className="tech-icon" />,
    },
    {
      title: "前端技术栈",
      description: "React 19 + TypeScript + Ant Design + Vite",
      icon: <ClusterOutlined className="tech-icon" />,
    },
    {
      title: "实时通信",
      description: "ASP.NET Core SignalR (WebSocket/Server-Sent Events)",
      icon: <InteractionOutlined className="tech-icon" />,
    },
    {
      title: "数据处理",
      description: "FastAPI + APScheduler + Jieba3 (词频分析)",
      icon: <LineChartOutlined className="tech-icon" />,
    },
    {
      title: "任务调度",
      description: "内存任务调度器 + 定时任务服务",
      icon: <ScheduleOutlined className="tech-icon" />,
    },
    {
      title: "架构模式",
      description: "CQRS + DDD + 事件驱动架构",
      icon: <DatabaseOutlined className="tech-icon" />,
    },
  ]

  const projectCapabilities = [
    {
      title: "高性能实时处理",
      description: "支持每秒数百条弹幕的实时捕获与推送",
      icon: <RocketOutlined className="capability-icon" />,
    },
    {
      title: "灵活部署",
      description: "支持配置化部署与本地开发调试",
      icon: <BulbOutlined className="capability-icon" />,
    },
    {
      title: "完整API",
      description: "提供 RESTful API 进行弹幕增删改查（CRUD）操作",
      icon: <ApiOutlined className="capability-icon" />,
    },
    {
      title: "实时推送",
      description: "使用 SignalR 实现实时弹幕推送",
      icon: <InteractionOutlined className="capability-icon" />,
    },
    {
      title: "智能分析",
      description: "自动生成词云图和小时级分布图表",
      icon: <BarChartOutlined className="capability-icon" />,
    },
    {
      title: "响应式界面",
      description: "前端响应式界面支持弹幕展示与管理",
      icon: <HeatMapOutlined className="capability-icon" />,
    },
    {
      title: "定时任务",
      description: "支持定时任务配置，可预设房间进行周期性捕获",
      icon: <ScheduleOutlined className="capability-icon" />,
    },
    {
      title: "高并发架构",
      description: "多层架构设计，支持高并发和可扩展性",
      icon: <ClusterOutlined className="capability-icon" />,
    },
  ]

  return (
    <div className="homeview-container">
      <div className="app-hero-bg" />

      <Card className="homeview-header-card">
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} md={14}>
            <Title level={1} className="homeview-title">
              斗鱼弹幕分析系统
            </Title>
            <Paragraph type="secondary" className="homeview-description">
              实时捕获、分析并可视化斗鱼直播弹幕，面向数据运营、内容分析与研究人员。
            </Paragraph>

            <Space size="middle" className="homeview-cta-buttons">
              <Button type="primary" size="large" href="/realtime-danmaku">
                查看实时弹幕
              </Button>
              <Button size="large" href="/dashboard">
                浏览数据仪表板
              </Button>
            </Space>
          </Col>

          <Col xs={24} md={10}>
            <Row gutter={[12, 12]}>
              {features.map((item, index) => (
                <Col xs={12} key={index}>
                  <Card hoverable>
                    <Meta avatar={item.icon} title={item.title} description={item.description} />
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>

      <Card className="homeview-content-card">
        <Divider orientation="horizontal">系统能力</Divider>
        <Row gutter={[16, 16]}>
          {projectCapabilities.map((item, index) => (
            <Col xs={24} sm={12} key={index}>
              <Card hoverable className="capability-card">
                <Meta avatar={item.icon} title={item.title} description={item.description} />
              </Card>
            </Col>
          ))}
        </Row>

        <Divider orientation="horizontal">技术架构</Divider>
        <Row gutter={[16, 16]} className="tech-stack-grid">
          {techStack.map((item, index) => (
            <Col xs={24} sm={12} md={8} lg={8} key={index}>
              <Card hoverable>
                <Meta avatar={item.icon} title={item.title} description={item.description} />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}

export default HomeView

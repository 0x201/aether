import React from 'react'
import { Card, Typography, Steps, Divider, Tag, Row, Col, Button, Space } from 'antd'
import {
  BulbOutlined,
  CodeOutlined,
  RocketOutlined,
  BarChartOutlined,
  CloudDownloadOutlined,
  HeatMapOutlined,
} from '@ant-design/icons'
import './HomeView.css'

const { Title, Paragraph } = Typography

const HomeView: React.FC = () => {
  const features = [
    {
      title: '弹幕捕获',
      description: '实时捕获指定斗鱼房间的弹幕消息，基于WebSocket实现高并发捕获',
      icon: <RocketOutlined />,
    },
    {
      title: '弹幕管理',
      description: '提供丰富功能的弹幕管理表格，可以查看、编辑和删除已捕获的弹幕数据',
      icon: <BulbOutlined />,
    },
    {
      title: '数据统计分析',
      description: '统计弹幕总数、唯一用户数、最活跃用户、时段分布等',
      icon: <BarChartOutlined />,
    },
    {
      title: '词频分析',
      description: '分析弹幕中的高频词汇，支持自动生成词频统计和词云图',
      icon: <CloudDownloadOutlined />,
    },
    {
      title: '可视化图表',
      description: '生成弹幕时间分布、最活跃用户Top20、词频Top20等图表',
      icon: <HeatMapOutlined />,
    },
    {
      title: '定时任务捕获',
      description: '支持配置定时任务，按计划自动捕获指定房间的弹幕数据',
      icon: <CodeOutlined />,
    },
  ]

  const techStack = [
    '后端：Asp.NET Core Web API + EntityFrameworkCore + PostgreSQL + SignalR',
    '前端：React 19 + TypeScript + Ant Design + Vite',
    '实时通信：ASP.NET Core SignalR (WebSocket/Server-Sent Events)',
    '数据处理：FastAPI + APScheduler + Jieba3 (词频分析)',
    '任务调度：内存任务调度器 + 定时任务服务',
    '架构模式：CQRS + DDD + 事件驱动架构',
  ]

  const projectCapabilities = [
    '支持每秒数百条弹幕的实时捕获与推送',
    '支持配置化部署与本地开发调试',
    '提供 RESTful API 进行弹幕增删改查（CRUD）操作',
    '使用 SignalR 实现实时弹幕推送',
    '自动生成词云图和小时级分布图表',
    '前端响应式界面支持弹幕展示与管理',
    '支持定时任务配置，可预设房间进行周期性捕获',
    '多层架构设计，支持高并发和可扩展性',
  ]

  const instructionSteps = [
    { title: '弹幕捕获', content: '在"弹幕捕获"页面输入斗鱼房间URL开始捕获' },
    { title: '弹幕管理', content: '在"弹幕管理"页面查看和管理已捕获的弹幕' },
    { title: '数据概览', content: '在"数据仪表板"页面查看统计分析和可视化图表' },
    { title: '实时弹幕', content: '使用"实时弹幕"页面查看实时推送的弹幕' },
    { title: '自定义日期', content: '使用日期选择器自定义数据查询范围' },
  ]

  return (
    <div className="homeview-container">
      <div className="app-hero-bg" />

      <Card className="glass-card homeview-header-card">
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
                  <Card hoverable variant="borderless" className="glass-card feature-card">
                    <div className="feature-card-container">
                      <div className="feature-icon">{item.icon}</div>
                      <div>
                        <div className="feature-title">{item.title}</div>
                        <div className="feature-description">{item.description}</div>
                      </div>
                  </div>
              </Card>
            </Col>
          ))}
        </Row>
          </Col>
        </Row>
      </Card>

      <Card className="glass-card homeview-content-card">
        <Divider orientation="horizontal">系统能力</Divider>
        <div className="project-capabilities">
          {projectCapabilities.map((item, index) => (
            <div key={index} className="capability-item">
              <Tag color="blue" className="capability-tag">
                {index + 1}
              </Tag>
              {item}
            </div>
          ))}
        </div>

        <Divider orientation="horizontal">使用说明</Divider>
        <Steps orientation="vertical" className="homeview-steps" items={instructionSteps} />

        <Divider orientation="horizontal">技术架构</Divider>
        <div className="instructions">
          {techStack.map((item, index) => (
            <div key={index} className="tech-stack-item">
              <CodeOutlined className="tech-stack-icon" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <Divider orientation="horizontal">实时推送服务 (SignalR)</Divider>
        <Paragraph style={{ lineHeight: '1.8' }}>
          项目使用 ASP.NET Core SignalR 技术实现实时弹幕推送功能。 SignalR 支持多种传输协议，包括
          WebSocket、Server-Sent Events 和长轮询，能够根据客户端环境自动选择最佳传输方式。
          这为弹幕的实时推送提供了高性能、低延迟的解决方案，确保用户能够即时看到最新的弹幕消息。
          SignalR 服务与前端 React 组件通过 Hub 进行通信，确保了数据的一致性和通信的健壮性。
          此外，SignalR 支持自动重连和消息缓冲，进一步增强了系统的可靠性。
        </Paragraph>

        <Divider orientation="horizontal">开发环境</Divider>
        <Paragraph style={{ lineHeight: '1.8' }}>
          <p>
            <strong>必需工具:</strong> .NET 10+, Node.js 18+, pnpm, Python 3.11+, uv（Python
            包管理工具）
          </p>
          <p>
            <strong>构建命令:</strong>
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>启动弹幕获取服务: 进入 DyDanmaku.API 目录并运行项目 (端口 5000/5001)</li>
            <li>
              启动词频分析服务: cd dydanmaku-analytics && uv sync && uv run python -m app.scheduler
            </li>
            <li>启动前端服务: cd dydanmaku-viewer && pnpm install && pnpm dev (端口 3015)</li>
            <li>数据库: PostgreSQL (默认端口 5432)</li>
          </ul>
        </Paragraph>
      </Card>
    </div>
  )
}

export default HomeView

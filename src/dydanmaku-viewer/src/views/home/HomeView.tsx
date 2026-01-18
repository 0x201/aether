import React from 'react';
import { Card, Typography, Steps, Divider, Tag, Row, Col, Flex } from 'antd';
import {
  BulbOutlined, CodeOutlined, RocketOutlined, BarChartOutlined,
  CloudDownloadOutlined, HeatMapOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const HomeView: React.FC = () => {
  const features = [
    {
      title: '弹幕捕获',
      description: '实时捕获指定斗鱼房间的弹幕消息，使用 Playwright 绕过反爬机制',
      icon: <RocketOutlined />
    },
    {
      title: '弹幕管理',
      description: '查看、编辑和删除已捕获的弹幕数据',
      icon: <BulbOutlined />
    },
    {
      title: '数据统计分析',
      description: '统计弹幕总数、唯一用户数、最活跃用户、时段分布等',
      icon: <BarChartOutlined />
    },
    {
      title: '词频分析',
      description: '分析弹幕中的高频词汇，支持自动生成词云图',
      icon: <CloudDownloadOutlined />
    },
    {
      title: '可视化图表',
      description: '生成弹幕时间分布、最活跃用户Top10、词频Top20等图表',
      icon: <HeatMapOutlined />
    }
  ];

  const techStack = [
    '后端：Python 3.13+ + FastAPI + SQLAlchemy + Playwright + SQLite',
    '前端：React 18+ + TypeScript + Ant Design + Vite',
    '实时通信：ASP.NET Core SignalR',
    '数据库迁移：Alembic',
    '中文分词：Jieba',
    '图表生成：WordCloud + Matplotlib',
    '推送服务：.NET SignalR'
  ];

  const projectCapabilities = [
    '支持每秒数百条弹幕的实时捕获与推送',
    '支持配置化部署与本地开发调试',
    '提供 RESTful API 进行弹幕增删改查（CRUD）操作',
    '使用 SignalR 实现实时弹幕推送',
    '自动生成词云图和小时级分布图表',
    '前端响应式界面支持弹幕展示与管理'
  ];

  return (
    <div className='homeview-container'>
      <Card>
        <Row justify="center" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Col span={24}>
            <Title level={1} style={{ color: '#1890ff' }}>斗鱼弹幕分析系统 (DyDanmaku)</Title>
            <Paragraph type="secondary" style={{ fontSize: '16px' }}>
              一个用于捕获、存储、分析和可视化斗鱼直播平台弹幕消息的完整系统
            </Paragraph>
          </Col>
        </Row>

        <Divider orientation="horizontal">项目简介</Divider>
        <Paragraph style={{ lineHeight: '1.8' }}>
          DyDanmaku 是一个用于捕获、存储、分析和可视化斗鱼直播平台弹幕消息的完整系统，支持从实时采集到数据展示的全流程处理。
          目标用户包括直播内容分析人员、主播运营团队、数据研究人员等需要对直播互动行为进行深入洞察的用户。
          系统解决斗鱼直播间弹幕数据难以获取、缺乏结构化存储与可视化分析的问题，提供一站式的弹幕监控与数据分析解决方案。
        </Paragraph>

        <Divider orientation="horizontal">核心功能</Divider>
        <Row gutter={[16, 16]}>
          {features.map((item, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card
                hoverable
                style={{ height: '100%', textAlign: 'center' }}
                cover={<div style={{ fontSize: '32px', margin: '16px 0' }}>{item.icon}</div>}
              >
                <Card.Meta
                  title={item.title}
                  description={item.description}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Divider orientation="horizontal">系统能力</Divider>
        <Flex vertical align='flex-start' justify='flex-start'>
          {projectCapabilities.map((item, index) => (
            <div key={index} style={{ padding: 10 }}>
              <Tag color="blue" style={{ marginRight: 8 }}>
                {index + 1}
              </Tag>
              {item}
            </div>
          ))}
        </Flex>

        <Divider orientation="horizontal">使用说明</Divider>
        <Steps
          orientation="vertical"
          size="small"
          current={-1}
          items={[
            { title: '在"弹幕捕获"页面输入斗鱼房间URL开始捕获' },
            { title: '在"弹幕管理"页面查看和管理已捕获的弹幕' },
            { title: '在"数据仪表板"页面查看统计分析和可视化图表' },
            { title: '使用"实时弹幕"页面查看实时推送的弹幕' },
            { title: '使用日期选择器自定义数据查询范围' }
          ]}
        />

        <Divider orientation="horizontal">技术架构</Divider>
        <div>
          {techStack.map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <CodeOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <Divider orientation="horizontal">实时推送服务 (SignalR)</Divider>
        <Paragraph style={{ lineHeight: '1.8' }}>
          项目使用 ASP.NET Core SignalR 技术实现实时弹幕推送功能。
          SignalR 支持多种传输协议，包括 WebSocket、Server-Sent Events 和长轮询，能够根据客户端环境自动选择最佳传输方式。
          这为弹幕的实时推送提供了高性能、低延迟的解决方案，确保用户能够即时看到最新的弹幕消息。
          SignalR 服务与前端 React 组件通过 Hub 进行通信，确保了数据的一致性和通信的健壮性。
        </Paragraph>

        <Divider orientation="horizontal">开发环境</Divider>
        <Paragraph style={{ lineHeight: '1.8' }}>
          <p><strong>必需工具:</strong> Python 3.13+, Node.js 16+, pnpm, Playwright（Chromium 浏览器）, uv（Python 包管理工具）</p>
          <p><strong>构建命令:</strong></p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>后端安装依赖: cd dydanmaku-api && uv sync</li>
            <li>初始化数据库: uv run alembic upgrade head</li>
            <li>启动后端服务: uv run fastapi run ./app/main.py</li>
            <li>启动 SignalR 推送服务: 进入 DyDanmaku.SignalR 目录并运行项目</li>
            <li>前端安装依赖: cd ../dydanmaku-viewer && pnpm install</li>
            <li>启动前端服务: pnpm dev</li>
          </ul>
          <p><strong>首次运行前:</strong> 执行 <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>playwright install chromium</code> 安装 Chromium 浏览器</p>
        </Paragraph>
      </Card>
    </div>
  );
};

export default HomeView;
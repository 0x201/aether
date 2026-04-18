import Layout, { Content, Header } from 'antd/es/layout/layout'
import Sider from 'antd/es/layout/Sider'
import React, { useState } from 'react'
import { Tabs, type TabsProps } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import HomeView from '@/src/views/home'
import DashboardView from '@/src/views/dashboard'
import CaptureView from '@/src/views/capture'
import DanmakuManagementView from '@/src/views/management'
import RealtimeDanmakuView from '@/src/views/realtime-danmaku'
import AppNavigation from './AppNavigation'
import './DefaultLayout.css'
import FloatButton from 'antd/es/float-button'
import ThemeSwitch from '../ThemeToggle/ThemeSwitch'
import MessageBox from '../MessageBox'

const DefaultLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const [tabs, setTabs] = useState([
    { key: '/', label: '首页', closable: false },
  ])

  const activeKey = location.pathname

  const addTab = (path: string, title: string) => {
    setTabs(prev => {
      if (!prev.some(tab => tab.key === path)) {
        return [...prev, { key: path, label: title, closable: true }]
      }
      return prev
    })
  }

  const removeTab = (targetKey: string) => {
    let newActiveKey = activeKey
    let lastIndex = -1

    tabs.forEach((tab, i) => {
      if (tab.key === targetKey) {
        lastIndex = i - 1
      }
    })

    const newPanes = tabs.filter(tab => tab.key !== targetKey)

    if (newPanes.length && newActiveKey === targetKey) {
      if (lastIndex >= 0) {
        newActiveKey = newPanes[lastIndex].key
      } else {
        newActiveKey = newPanes[0].key
      }
    }

    setTabs(newPanes)
    if (activeKey === targetKey) {
      navigate(newActiveKey)
    }
  }

  const onEdit = (targetKey: string | React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element>, action: 'add' | 'remove') => {
    if (action === 'remove') {
      const key = typeof targetKey === 'string' ? targetKey : (targetKey.target as HTMLElement).getAttribute('data-node-key');
      if (key) {
        removeTab(key);
      }
    }
  }

  const onTabClick = (key: string) => {
    navigate(key)
  }

  const getTitleFromPath = (path: string): string => {
    switch (path) {
      case '/': return '首页'
      case '/dashboard': return '数据概览'
      case '/capture': return '弹幕捕获'
      case '/management': return '弹幕管理'
      case '/realtime-danmaku': return '实时弹幕'
      default: return '新标签页'
    }
  }

  React.useEffect(() => {
    if (!tabs.some(tab => tab.key === location.pathname)) {
      addTab(location.pathname, getTitleFromPath(location.pathname))
    }
  }, [location.pathname])


  const renderCurrentView = () => {
    switch (activeKey) {
      case '/':
        return <HomeView />;
      case '/dashboard':
        return <DashboardView />;
      case '/capture':
        return <CaptureView />;
      case '/management':
        return <DanmakuManagementView />;
      case '/realtime-danmaku':
        return <RealtimeDanmakuView />;
      default:
        return <HomeView />;
    }
  }

  const items: TabsProps['items'] = tabs.map((tab) => {
    return {
      label: tab.label,
      key: tab.key,
      closable: tab.closable,
      children: tab.key === activeKey ? renderCurrentView() : null,
    }
  })

  return (
    <Layout>
      <Header className="header-layout">
        <div className="header-left">
          <div className="logo" />
          <h1>斗鱼弹幕系统</h1>
        </div>
        <div className="header-center">
          <AppNavigation mode="horizontal" />
        </div>
        <div className="header-right">
          <MessageBox />
          <ThemeSwitch />
        </div>
      </Header>

      <Layout>
        <Sider
          collapsed={collapsed}
          collapsible
          onCollapse={(value) => setCollapsed(value)}
          collapsedWidth="60"
          className="sider-container"
        >
          <AppNavigation mode="inline" />
        </Sider>
        <Content className="content-container">
          <Tabs
            type="editable-card"
            activeKey={activeKey}
            hideAdd
            onEdit={onEdit}
            items={items}
            onTabClick={onTabClick}
            size="middle"
          />
          <FloatButton.BackTop />
        </Content>
      </Layout>
    </Layout>
  )
}

export default DefaultLayout
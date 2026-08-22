import { Layout, theme } from 'antd'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Tabs, type TabsProps } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ThemeSwitch } from '@/src/components/ThemeToggle'
import MessageBox from '@/src/components/message-box'
import { menuConfig } from '@/src/config/menuConfig'
import { Menu, type MenuProps } from 'antd'
import type { AppNavigationProps } from './type'
import {
  BarChartOutlined,
  LineChartOutlined,
  SettingOutlined,
  RadarChartOutlined,
  UnorderedListOutlined,
  HomeOutlined,
  EyeOutlined,
  BellOutlined,
} from '@ant-design/icons'

import './styles.css'

const { Header, Content, Sider } = Layout

const AppNavigation: React.FC<AppNavigationProps> = (props: AppNavigationProps) => {
  const navigate = useNavigate()
  const location = useLocation()

  const { mode = 'horizontal', theme = 'light', currentMainMenu, onMenuClick } = props

  const mainMenuItems = menuConfig.map((item) => ({
    label: item.label,
    icon: item.icon,
    key: item.path || `/${item.key}`,
  }))

  const onClick: MenuProps['onClick'] = (e) => {
    if (onMenuClick) {
      onMenuClick(e.key)
    } else {
      navigate(e.key)
    }
  }

  return (
    <Menu
      onClick={onClick}
      selectedKeys={[currentMainMenu || location.pathname]}
      mode={mode}
      items={mainMenuItems}
      theme={theme}
      style={{
        flex: 1,
        height: '100%',
        width: '100%',
        border: 0,
        backgroundColor: 'transparent',
        boxShadow: 'none',
      }}
    />
  )
}

type MenuItem = Required<MenuProps>['items'][number]

const SidebarMenu: React.FC<{ currentMainMenu?: string }> = ({ currentMainMenu }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const subMenuItems = currentMainMenu
    ? menuConfig.find((menu) => menu.path === currentMainMenu)?.children || []
    : []

  const getIconByType = (iconType: string | null | undefined) => {
    if (!iconType) return null
    const iconMap: Record<string, React.ReactNode> = {
      'bar-chart': <BarChartOutlined />,
      'line-chart': <LineChartOutlined />,
      setting: <SettingOutlined />,
      'radar-chart': <RadarChartOutlined />,
      'unordered-list': <UnorderedListOutlined />,
      home: <HomeOutlined />,
      eye: <EyeOutlined />,
      bell: <BellOutlined />,
    }
    return iconMap[iconType] || null
  }

  const menuItems: MenuItem[] = subMenuItems.map((item) => ({
    key: item.path,
    label: item.label,
    icon: getIconByType(item.icon),
  }))

  const onClick: MenuProps['onClick'] = (e) => {
    navigate(e.key)
  }

  const getSelectedKeys = () => {
    const exactMatch = subMenuItems.find((item) => item.path === location.pathname)
    if (exactMatch) return [exactMatch.path]

    const parentMatch = subMenuItems.find((item) => location.pathname.startsWith(item.path + '/'))
    if (parentMatch) return [parentMatch.path]

    return [location.pathname]
  }

  return <Menu onClick={onClick} selectedKeys={getSelectedKeys()} mode="inline" items={menuItems} />
}

const getMainModulePath = (pathname: string): string => {
  if (pathname === '/') return '/'
  for (const menu of menuConfig) {
    if (menu.path && menu.path !== '/') {
      if (pathname.startsWith(menu.path)) {
        return menu.path
      }
    }
  }
  return '/'
}

const getTitleFromPath = (path: string): string => {
  for (const menu of menuConfig) {
    if (menu.path === path) return menu.label
    if (menu.children) {
      const child = menu.children.find((c) => c.path === path)
      if (child) return child.label
    }
  }
  return '新标签页'
}

const DefaultLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const [moduleTabsMap, setModuleTabsMap] = useState<Map<string, TabItem[]>>(
    new Map([['/', [{ key: '/', label: '首页', closable: false }]]]),
  )

  type TabItem = { key: string; label: string; closable: boolean }

  const currentMainModule = useMemo(() => getMainModulePath(location.pathname), [location.pathname])

  const currentTabs = useMemo(() => {
    return moduleTabsMap.get(currentMainModule) || []
  }, [moduleTabsMap, currentMainModule])

  const activeKey = location.pathname

  const updateModuleTabs = useCallback((modulePath: string, newTabs: TabItem[]) => {
    setModuleTabsMap((prev) => new Map(prev).set(modulePath, newTabs))
  }, [])

  const addTab = useCallback(
    (path: string) => {
      const modulePath = getMainModulePath(path)
      const currentModuleTabs = moduleTabsMap.get(modulePath) || []

      if (!currentModuleTabs.some((tab) => tab.key === path)) {
        const title = getTitleFromPath(path)
        const newTab: TabItem = {
          key: path,
          label: title,
          closable: path !== modulePath,
        }
        updateModuleTabs(modulePath, [...currentModuleTabs, newTab])
      }
    },
    [moduleTabsMap, updateModuleTabs],
  )

  const removeTab = useCallback(
    (targetKey: string) => {
      const modulePath = getMainModulePath(targetKey)
      const currentModuleTabs = moduleTabsMap.get(modulePath) || []

      if (targetKey === modulePath && currentModuleTabs.length === 1) {
        return
      }

      const newTabs = currentModuleTabs.filter((tab) => tab.key !== targetKey)
      updateModuleTabs(modulePath, newTabs)

      if (targetKey === location.pathname) {
        const nextActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].key : modulePath
        navigate(nextActive)
      }
    },
    [moduleTabsMap, location.pathname, navigate, updateModuleTabs],
  )

  const onEdit: TabsProps['onEdit'] = (targetKey, action) => {
    if (action === 'remove' && typeof targetKey === 'string') {
      removeTab(targetKey)
    }
  }

  const onTabClick = (key: string) => {
    navigate(key)
  }

  useEffect(() => {
    const currentPath = location.pathname
    const modulePath = currentMainModule

    if (!moduleTabsMap.has(modulePath)) {
      const defaultTab: TabItem = {
        key: modulePath,
        label: getTitleFromPath(modulePath),
        closable: modulePath !== '/',
      }
      updateModuleTabs(modulePath, [defaultTab])
    }

    const moduleTabs = moduleTabsMap.get(modulePath) || []
    if (!moduleTabs.some((tab) => tab.key === currentPath)) {
      addTab(currentPath)
    }
  }, [location.pathname, currentMainModule, moduleTabsMap, addTab, updateModuleTabs])

  const currentMainMenu = useMemo(() => {
    if (location.pathname === '/') return '/'
    const matched = menuConfig.find(
      (menu) =>
        menu.path === location.pathname ||
        (menu.children && menu.children.some((child) => location.pathname.startsWith(child.path))),
    )
    return matched?.path || '/'
  }, [location.pathname])

  const handleMenuClick = (path: string) => {
    navigate(path)
    const modulePath = getMainModulePath(path)
    if (!moduleTabsMap.has(modulePath)) {
      const defaultTab: TabItem = {
        key: modulePath,
        label: getTitleFromPath(modulePath),
        closable: modulePath !== '/',
      }
      updateModuleTabs(modulePath, [defaultTab])
    }
  }

  const tabItems: TabsProps['items'] = currentTabs.map((tab) => ({
    label: tab.label,
    key: tab.key,
    closable: tab.closable,
  }))

  return (
    <Layout>
      <Header className="header-layout" style={{ backgroundColor: colorBgContainer }}>
        <div className="header-left">
          <div className="logo" onClick={() => navigate('/')} />
          <h1 onClick={() => navigate('/')}>Social Dashboard</h1>
        </div>
        <div className="header-center">
          <AppNavigation currentMainMenu={currentMainMenu} onMenuClick={handleMenuClick} />
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
          onCollapse={setCollapsed}
          collapsedWidth="60"
          className="sider-container"
        >
          <SidebarMenu currentMainMenu={currentMainMenu} />
        </Sider>
        <Content className="content-container">
          <Tabs
            hideAdd
            onChange={onTabClick}
            activeKey={activeKey}
            type="editable-card"
            items={tabItems}
            onEdit={onEdit}
            size="small"
          />
          <div>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default DefaultLayout

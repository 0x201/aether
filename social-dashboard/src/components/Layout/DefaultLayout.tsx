import { Layout, theme } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppNavigation } from '.'
import ThemeSwitch from '../ThemeToggle/ThemeSwitch'
import { MessageBox } from '../MessageBox'
import { menuConfig } from '@/src/config/menuConfig'
import './DefaultLayout.css'
import SidebarMenu from './SidebarMenu'
import { useState } from 'react'

const { Header, Content, Sider } = Layout

const DefaultLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const getCurrentMainMenu = () => {
    if (pathname === '/') return '/'
    const matchedMenu = menuConfig.find((menu) => {
      if (menu.path === pathname) return true
      if (menu.children && menu.children.some((child) => pathname.startsWith(child.path))) {
        return true
      }

      return false
    })

    return matchedMenu ? matchedMenu.path : pathname
  }

  const currentMainMenu = getCurrentMainMenu()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header-layout" style={{ backgroundColor: colorBgContainer }}>
        <div className="header-left">
          <div className="logo" onClick={() => navigate('/')} />
          <h1 onClick={() => navigate('/')}>Social Dashboard</h1>
        </div>
        <div className="header-center">
          <AppNavigation currentMainMenu={currentMainMenu} onMenuClick={(path) => navigate(path)} />
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
          <SidebarMenu currentMainMenu={currentMainMenu} />
        </Sider>
        <Content className="content-container">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default DefaultLayout

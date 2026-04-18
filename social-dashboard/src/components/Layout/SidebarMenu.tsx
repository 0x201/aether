import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { menuConfig } from '@/src/config/menuConfig'
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

  const getCurrentSubMenuKey = () => {
    if (!currentMainMenu) return location.pathname

    const parentMenu = menuConfig.find((menu) => menu.path === currentMainMenu)
    if (!parentMenu?.children) return location.pathname
    const activeSubMenu = parentMenu.children.find((child) =>
      location.pathname.startsWith(child.path),
    )

    return activeSubMenu ? activeSubMenu.path : location.pathname
  }

  return (
    <Menu
      onClick={onClick}
      selectedKeys={[getCurrentSubMenuKey()]}
      mode="inline"
      items={menuItems}
    />
  )
}

export default SidebarMenu

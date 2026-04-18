import { Menu, type MenuProps } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import type { AppNavigationProps } from './type'
import { menuConfig } from '@/src/config/menuConfig'

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
export default AppNavigation

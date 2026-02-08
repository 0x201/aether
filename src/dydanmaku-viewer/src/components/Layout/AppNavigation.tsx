import { DashboardOutlined, TableOutlined, UserOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { Menu, type MenuProps } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import type { AppNavigationProps } from "./type";


const AppNavigation: React.FC<AppNavigationProps> = (props: AppNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { mode = 'horizontal', theme = 'light' } = props;

  const items: MenuProps['items'] = [
    {
      label: '系统首页',
      icon: <UserOutlined />,
      key: '/',
    },
    {
      label: '仪表盘',
      icon: <DashboardOutlined />,
      key: '/dashboard',
    },
    {
      label: '弹幕捕获',
      icon: <VideoCameraOutlined />,
      key: '/capture',
    },
    {
      label: '弹幕管理',
      icon: <TableOutlined />,
      key: '/management',
    },
    {
      label: '实时弹幕',
      icon: <VideoCameraOutlined />,
      key: '/realtime-danmaku',
    },

  ];

  const onClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  return (
    <Menu
      onClick={onClick}
      selectedKeys={[location.pathname]}
      mode={mode}
      items={items}
      theme={theme}
      style={{
        flex: 1,
        height: '100%',
        width: '100%',
        border: 0,
      }}
    />
  );
};
export default AppNavigation;
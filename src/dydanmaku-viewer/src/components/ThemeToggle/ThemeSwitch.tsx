import React from 'react';
import { Button, Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd';
import { 
  SunOutlined, 
  MoonOutlined,
  CheckOutlined, 
  SyncOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useTheme } from '@/src/contexts/ThemeContext';


const ThemeSwitch: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();

  const items: MenuProps['items'] = [
    {
      key: 'light',
      label: (
        <Space>
          Light
          {themeMode === 'light' && <CheckOutlined style={{ marginLeft: 8 }} />}
        </Space>
      ),
      icon: <SunOutlined />,
      onClick: () => setThemeMode('light'),
    },
    {
      key: 'dark',
      label: (
        <Space>
          Dark
          {themeMode === 'dark' && <CheckOutlined style={{ marginLeft: 8 }} />}
        </Space>
      ),
      icon: <MoonOutlined />,
      onClick: () => setThemeMode('dark'),
    },
    {
      key: 'auto',
      label: (
        <Space>
          Follow System
          {themeMode === 'auto' && <CheckOutlined style={{ marginLeft: 8 }} />}
        </Space>
      ),
      icon: <SyncOutlined />,
      onClick: () => setThemeMode('auto'),
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight" trigger={['hover']}>
      <Button
        type="text"
        icon={<SettingOutlined />}
        style={{
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
        }}
      />
    </Dropdown>
  );
};

export default ThemeSwitch;
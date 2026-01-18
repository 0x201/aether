// src/components/AnimatedThemeSwitch.tsx
import React from 'react';
import { Switch, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTheme } from '@/src/contexts/ThemeContext';
import './AnimatedThemeSwitch.css';

const AnimatedThemeSwitch: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Tooltip title={`${isDarkMode ? '明亮' : '暗黑'}模式`}>
      <div className="animated-theme-switch">
        <Switch
          checked={isDarkMode}
          onChange={toggleTheme}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
          className="animated-switch"
        />
      </div>
    </Tooltip>
  );
};

export default AnimatedThemeSwitch;
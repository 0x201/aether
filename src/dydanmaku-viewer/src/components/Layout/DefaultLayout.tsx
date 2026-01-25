import { ThemeProvider } from '@/src/contexts/ThemeContext';
import Layout, { Content, Header } from 'antd/es/layout/layout';
import React, { useState } from 'react';
import Sider from 'antd/es/layout/Sider';
import { Route, Routes } from 'react-router-dom';
import HomeView from '@/src/views/home';
import DashboardView from '@/src/views/dashboard';
import CaptureView from '@/src/views/capture';
import DanmakuManagementView from '@/src/views/management';
import RealtimeDanmakuView from '@/src/views/realtime-danmaku';
import AnimatedThemeSwitch from '@/src/components/ThemeToggle/AnimatedThemeSwitch';
import AppNavigation from './AppNavigation';
import './DefaultLayout.css';
import { Badge, Dropdown, FloatButton, type MenuProps } from 'antd';
import { useMessageContext } from '@/src/contexts/MessageContext';
import dayjs from 'dayjs';
import { BellOutlined, ClearOutlined } from '@ant-design/icons';

const DefaultLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { notifications, unreadCount, markAsRead, clearAll } = useMessageContext();

    const menuItems: MenuProps['items'] = notifications.length > 0
        ? notifications.map((notification, index) => ({
            key: `notification-${index}`,
            label: (
                <div style={{ width: '300px' }}>
                    <div><strong>房间: {notification.roomId}</strong></div>
                    <div>统计周期: {notification.periodType}</div>
                    <div>开始时间：{notification.startDate}</div>
                    <div>结束时间：{notification.endDate}</div>
                    <div>词频数: {notification.frequenciesCount}</div>
                    <div>时间: {dayjs(notification.completedAt).format('YYYY-MM-DD HH:mm:ss')}</div>
                </div>
            ),
            onClick: () => markAsRead(notification.id)
        }))
        : [{
            key: 'empty',
            label: '暂无通知',
            disabled: true
        }];

    const actionMenuItems: MenuProps['items'] = [
        {
            key: 'clear-all',
            label: '清空所有',
            icon: <ClearOutlined />,
            danger: true,
            onClick: clearAll
        }
    ];

    const dropdownMenu: MenuProps = {
        items: [...menuItems, ...actionMenuItems]
    };

    return (
        <ThemeProvider>
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
                        <Dropdown menu={dropdownMenu} trigger={['click']} placement="bottomRight">
                            <Badge count={unreadCount}>
                                <BellOutlined style={{ fontSize: '20px', cursor: 'pointer' }} />
                            </Badge>
                        </Dropdown>
                        <AnimatedThemeSwitch />
                    </div>
                </Header>

                <Layout style={{ marginTop: 12 }}>
                    <Sider
                        collapsed={collapsed}
                        collapsible
                        onCollapse={(value) => setCollapsed(value)}
                        collapsedWidth="60"
                        className='sider-container'
                    >
                        <AppNavigation mode='inline' />
                    </Sider>
                    <Content className='content-container'>
                        <Routes>
                            <Route path="/" element={<HomeView />} />
                            <Route path="/dashboard" element={<DashboardView />} />
                            <Route path="/capture" element={<CaptureView />} />
                            <Route path="/management" element={<DanmakuManagementView />} />
                            <Route path="/realtime-danmaku" element={<RealtimeDanmakuView />} />
                        </Routes>
                        <FloatButton.BackTop />
                    </Content>
                </Layout>
            </Layout>
        </ThemeProvider>
    )
};

export default DefaultLayout;
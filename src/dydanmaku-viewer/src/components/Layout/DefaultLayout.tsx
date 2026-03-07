import { ThemeProvider } from '@/src/contexts/ThemeProvider';
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
import FloatButton from 'antd/es/float-button';
import ThemeSwitch from '../ThemeToggle/ThemeSwitch';
import MessageBox from '../MessageBox';

const DefaultLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);

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
                        <MessageBox />
                        <AnimatedThemeSwitch />
                        <ThemeSwitch />
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
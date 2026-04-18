import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { DefaultLayout } from '@/src/components/Layout'
import HomeView from '@/src/views/home'
import DashboardView from '@/src/views/dashboard'
import CaptureView from '@/src/views/capture'
import DanmakuMgt from '@/src/views/management'
import RealtimeDanmaku from '@/src/views/realtime-danmaku'
import { MessageProvider } from './contexts/MessageContext'
import { ThemeProvider } from './contexts/ThemeProvider'
import './App.css'

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <MessageProvider>
        <Routes>
          <Route path="/" element={<DefaultLayout />}>
            <Route index element={<HomeView />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/capture" element={<CaptureView />} />
            <Route path="/management" element={<DanmakuMgt />} />
            <Route path="/realtime-danmaku" element={<RealtimeDanmaku />} />
          </Route>
        </Routes>
      </MessageProvider>
    </ThemeProvider>
  )
}

export default App

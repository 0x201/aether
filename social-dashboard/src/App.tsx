import React from 'react'
import { DefaultLayout } from '@/src/components/Layout'
import { MessageProvider } from './contexts/MessageContext'
import { ThemeProvider } from './contexts/ThemeProvider'
import './App.css'

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <MessageProvider>
        <DefaultLayout />
      </MessageProvider>
    </ThemeProvider>
  )
}

export default App

import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { MessageProvider } from './contexts/MessageContext'
import { ThemeProvider } from './contexts/ThemeProvider'
import './App.css'
import { router } from '@/src/router'

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <MessageProvider>
        <RouterProvider router={router} />
      </MessageProvider>
    </ThemeProvider>
  )
}

export default App

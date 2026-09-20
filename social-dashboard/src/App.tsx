import React from "react"
import { RouterProvider } from "react-router-dom"

import { router } from "@/src/router"

import { MessageProvider } from "./contexts/MessageContext"

import "./App.css"
import { ThemeProvider } from "./contexts/ThemeProvider"

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

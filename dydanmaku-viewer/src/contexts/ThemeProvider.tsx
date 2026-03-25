import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { ConfigProvider } from 'antd'
import { lightTheme, darkTheme, type ThemeMode, getSystemTheme } from '@/src/themes'
import { ThemeContext, type ThemeContextType } from './useTheme'


const THEME_STORAGE_KEY = 'dydanmaku-viewer-theme-mode'
const THEME_MODES: ThemeMode[] = ['light', 'dark', 'auto']

const getStoredThemeMode = (): ThemeMode => {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode
    return storedTheme && THEME_MODES.includes(storedTheme) ? storedTheme : 'auto'
  } catch {
    return 'auto'
  }
}

const applyThemeToDocument = (theme: 'light' | 'dark') => {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.classList.remove('light-theme', 'dark-theme')
  root.classList.add(`${theme}-theme`)
  root.style.setProperty('--ant-prefix', theme)
}

const useSystemTheme = (): 'light' | 'dark' => {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return systemTheme
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getStoredThemeMode)
  const systemTheme = useSystemTheme()

  const currentTheme = useMemo<'light' | 'dark'>(
    () => (themeMode === 'auto' ? systemTheme : themeMode),
    [themeMode, systemTheme],
  )

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode)
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  }, [])

  const toggleTheme = useCallback(() => {
    const currentIndex = THEME_MODES.indexOf(themeMode)
    const nextIndex = (currentIndex + 1) % THEME_MODES.length
    setThemeMode(THEME_MODES[nextIndex])
  }, [themeMode, setThemeMode])

  const toggleBetweenLightAndDark = useCallback(() => {
    const targetMode = currentTheme === 'light' ? 'dark' : 'light'
    setThemeMode(targetMode)
  }, [currentTheme, setThemeMode])

  useEffect(() => {
    applyThemeToDocument(currentTheme)
  }, [currentTheme])

  const themeConfig = useMemo(
    () => (currentTheme === 'dark' ? darkTheme : lightTheme),
    [currentTheme],
  )

  const contextValue = useMemo<ThemeContextType>(
    () => ({
      themeMode,
      currentTheme,
      setThemeMode,
      toggleTheme,
      toggleBetweenLightAndDark,
    }),
    [themeMode, currentTheme, setThemeMode, toggleTheme, toggleBetweenLightAndDark],
  )

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  )
}

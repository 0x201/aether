import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ConfigProvider } from 'antd';
import { lightTheme, darkTheme, type ThemeMode, getSystemTheme } from '@/src/themes';

interface ThemeContextType {
  themeMode: ThemeMode;
  currentTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  toggleBetweenLightAndDark: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'dydanmaku-viewer-theme-mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
    return savedTheme && ['light', 'dark', 'auto'].includes(savedTheme) ? savedTheme : 'auto';
  });

  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    if (themeMode === 'auto') {
      return getSystemTheme();
    }
    return themeMode;
  });

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  const toggleTheme = useCallback(() => {
    const modes: ThemeMode[] = ['light', 'dark', 'auto'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  }, [themeMode]);

  const toggleBetweenLightAndDark = useCallback(() => {
    if (themeMode === 'light' || themeMode === 'auto' && getSystemTheme() === 'light') {
      setThemeMode('dark');
    } else {
      setThemeMode('light');
    }
  }, [themeMode, setThemeMode]);


  useEffect(() => {
    if (themeMode !== 'auto') {
      setCurrentTheme(themeMode);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setCurrentTheme(e.matches ? 'dark' : 'light');
    };
    setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(`${currentTheme}-theme`);
    document.documentElement.style.setProperty('--ant-prefix', currentTheme);
  }, [currentTheme]);

  const themeConfig = useMemo(() => {
    const baseConfig = currentTheme === 'dark' ? darkTheme : lightTheme;
    return baseConfig;
  }, [currentTheme]);

  const contextValue = useMemo(() => ({
    themeMode,
    currentTheme,
    setThemeMode,
    toggleTheme,
    toggleBetweenLightAndDark,
  }), [themeMode, currentTheme, setThemeMode, toggleTheme, toggleBetweenLightAndDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={themeConfig}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
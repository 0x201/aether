import type { ThemeConfig } from "antd"
import { theme } from "antd"

const { darkAlgorithm, defaultAlgorithm } = theme;

export const lightTheme: ThemeConfig = {
  token: {},

  components: {
    Layout: {
      headerBg: '#ffffff',
      headerColor: '#ffffff',
      bodyBg: '#ffffff',
      footerBg: '#f5f5f5',
      //footerBg: '#ffffff',
      siderBg: '#ffffff',
    },
  },
  cssVar: {
    prefix: "ant",
    key: 'light',
  },
  algorithm: defaultAlgorithm,
};

export const darkTheme: ThemeConfig = {
  token: {},
  components: {
    Layout: {
      headerBg: 'rgb(20, 20, 20)',
    }
  },
  cssVar: {
    prefix: "ant",
    key: 'dark',
  },
  algorithm: darkAlgorithm,
}

export type ThemeMode = 'light' | 'dark' | 'auto';

export const getSystemTheme = (): 'light' | 'dark' => {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return isDark ? 'dark' : 'light';
}
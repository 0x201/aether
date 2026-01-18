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

  algorithm: defaultAlgorithm,
};

export const darkTheme: ThemeConfig = {
  token: {},
  components: {
    Layout: {
      headerBg: 'rgb(20, 20, 20)',
    }
  },
  algorithm: darkAlgorithm,
}
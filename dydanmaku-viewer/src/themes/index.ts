import type { ThemeConfig } from "antd";
import { theme } from "antd";

const { darkAlgorithm, defaultAlgorithm, compactAlgorithm } = theme;

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: "#52c41a",
    colorInfo: "#1677ff",
    borderRadius: 8,
    wireframe: false,
  },

  components: {
    Layout: {
      headerBg: "#ffffff",
      headerColor: "#ffffff",
      bodyBg: "#ffffff",
      footerBg: "#f5f5f5",
      siderBg: "#ffffff",
    },
    Card: {
      borderRadiusLG: 12,
      paddingLG: 24,
    },
    Table: {
      cellPaddingBlockSM: 12,
      cellPaddingInlineSM: 8,
      cellPaddingBlockMD: 16,
      cellPaddingInlineMD: 12,
    },
  },
  cssVar: {
    prefix: "ant",
    key: "light",
  },
  algorithm: [defaultAlgorithm, compactAlgorithm],
};

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: "#73d13d",
    colorInfo: "#69c0ff",
    borderRadius: 8,
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: "rgba(29, 30, 41, 0.9)",
    },
    Table: {
      cellPaddingBlockSM: 12,
      cellPaddingInlineSM: 8,
      cellPaddingBlockMD: 16,
      cellPaddingInlineMD: 12,
    },
  },
  cssVar: {
    prefix: "ant",
    key: "dark",
  },
  algorithm: [darkAlgorithm, compactAlgorithm],
};

export type ThemeMode = "light" | "dark" | "auto";

export const getSystemTheme = (): "light" | "dark" => {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return isDark ? "dark" : "light";
};

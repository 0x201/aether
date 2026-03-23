import { createContext, useContext } from "react";
import type { ThemeMode } from "@/src/themes";

export interface ThemeContextType {
  themeMode: ThemeMode;
  currentTheme: "light" | "dark";
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  toggleBetweenLightAndDark: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export { ThemeContext };

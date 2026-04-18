export interface AppNavigationProps {
  mode?: 'horizontal' | 'inline'
  theme?: 'light' | 'dark'
  currentMainMenu?: string
  onMenuClick?: (key: string) => void
}

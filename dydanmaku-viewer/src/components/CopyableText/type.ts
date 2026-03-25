import type { ReactNode } from 'react'

export interface CopyableTextProps {
  text: string
  children?: ReactNode
  style?: React.CSSProperties
  tooltip?: string
}

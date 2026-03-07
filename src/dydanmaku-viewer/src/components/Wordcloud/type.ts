import type { Word } from 'd3-cloud'

export const colormapOptions = [
    {
        value: 'viridis',
        label: 'Viridis',
        color: 'linear-gradient(to right, #440154, #21918c, #fde725)',
    },
    {
        value: 'plasma',
        label: 'Plasma',
        color: 'linear-gradient(to right, #0d0887, #cc4778, #f0f921)',
    },
    {
        value: 'inferno',
        label: 'Inferno',
        color: 'linear-gradient(to right, #000004, #bc3754, #fcffa4)',
    },
    {
        value: 'magma',
        label: 'Magma',
        color: 'linear-gradient(to right, #000004, #b73779, #fcffa4)',
    },
    {
        value: 'cividis',
        label: 'Cividis',
        color: 'linear-gradient(to right, #00204d, #5a9367, #fca58f)',
    },
    {
        value: 'rainbow',
        label: 'Rainbow',
        color: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)',
    },
]

export interface WordCloudProps {
    /** Word cloud data */
    words: Word[]
    /** Width */
    width?: number
    /** Height */
    height?: number
    /** Color map type */
    colormap?:
        | 'viridis'
        | 'plasma'
        | 'inferno'
        | 'magma'
        | 'cividis'
        | 'rainbow'
        | 'custom'
    /** Custom color function */
    customColor?: (value: number) => string
    /** Rotation angle function */
    rotation?: () => number
    /** Font family */
    fontFamily?: string
    /** Word cloud layout type */
    spiral?: 'archimedean' | 'rectangular'
    /** Callback when clicking on a word */
    onWordClick?: (word: Word) => void
    /** Callback when hovering over a word */
    onWordHover?: (word: Word | null) => void
    /** Whether to show tooltip */
    showTooltip?: boolean
    /** Minimum font size */
    minFontSize?: number
    /** Maximum font size */
    maxFontSize?: number
}

export interface WordItem {
    text: string
    size: number
}

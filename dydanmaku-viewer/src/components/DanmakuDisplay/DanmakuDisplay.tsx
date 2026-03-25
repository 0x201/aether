import React, { useEffect, useRef, useCallback } from 'react'
import './DanmakuDisplay.style.css'
import type { DanmakuDisplayProps } from './type'

const DanmakuDisplay: React.FC<DanmakuDisplayProps> = (props: DanmakuDisplayProps) => {
  const { danmakuList, autoScroll = true } = props
  const SCROLL_THRESHOLD = 10

  const danmakuContainerRef = useRef<HTMLUListElement>(null)
  const isAutoScrollingRef = useRef<boolean>(true)

  const calculateUserLevelDataLevel = (userLevel: string | number): number => {
    const levelNum = parseInt(userLevel.toString().replace(/[^0-9]/g, '')) || 0
    switch (true) {
      case levelNum >= 1 && levelNum <= 14:
        return 0
      case levelNum >= 15 && levelNum <= 29:
        return 1
      case levelNum >= 30 && levelNum <= 39:
        return 2
      case levelNum >= 40 && levelNum <= 49:
        return 3
      case levelNum >= 50 && levelNum <= 59:
        return 4
      case levelNum >= 60 && levelNum <= 69:
        return 5
      case levelNum >= 70 && levelNum <= 79:
        return 6
      case levelNum >= 80 && levelNum <= 89:
        return 7
      case levelNum >= 90 && levelNum <= 99:
        return 8
      default:
        return 0
    }
  }

  // Check if user has scrolled to the top
  const checkIfAtTop = useCallback(() => {
    if (!danmakuContainerRef.current) return true

    const { scrollTop } = danmakuContainerRef.current
    return scrollTop <= SCROLL_THRESHOLD
  }, [])

  // Handle scroll events to detect user scrolling
  const handleScroll = useCallback(() => {
    isAutoScrollingRef.current = checkIfAtTop()
  }, [checkIfAtTop])

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    if (autoScroll && danmakuContainerRef.current && isAutoScrollingRef.current) {
      requestAnimationFrame(() => {
        if (danmakuContainerRef.current) {
          danmakuContainerRef.current.scrollTop = 0
        }
      })
    }
  }, [autoScroll])

  // Handle scrolling
  useEffect(() => {
    const container = danmakuContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Scroll to top when danmakuList changes
  useEffect(() => {
    scrollToTop()
  }, [danmakuList, scrollToTop])

  return (
    <div className="danmaku-container">
      <div className="danmaku-main">
        <ul className="danmaku-list" ref={danmakuContainerRef}>
          {danmakuList.map((danmaku, index) => (
            <li key={`${danmaku.id}-${index}`} className="danmaku-item">
              <div className="danmaku-notice">
                {danmaku.userLevel && (
                  <span
                    className="user-level"
                    data-level={calculateUserLevelDataLevel(danmaku.userLevel)}
                  >
                    {danmaku.userLevel}
                  </span>
                )}
                {danmaku.fanMedalLevel !== undefined &&
                  danmaku.fanMedalLevel > 0 &&
                  danmaku.fanMedalName && (
                    <span
                      className="fan-medal-container"
                      data-level={Math.floor(danmaku.fanMedalLevel / 10)}
                    >
                      <span className="fan-medal-level">{danmaku.fanMedalLevel}</span>
                      <span className="fan-medal-name">{danmaku.fanMedalName}</span>
                    </span>
                  )}
                <span className="username">{danmaku.userName}</span>
                <span className="is-colon">:</span>
                <span className="content">{danmaku.content}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default DanmakuDisplay

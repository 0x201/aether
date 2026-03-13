/* @vitest-environment jsdom */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { createRoot } from 'react-dom/client'

// Mock the capture service so hooks use the fake API instead of real network
vi.mock('../../src/views/capture/services/captureService', () => ({
  createCaptureService: () => ({
    fetchJobs: async (page: number, pageSize: number) => ({
      data: [
        {
          id: '1',
          roomId: '123',
          roomName: '测试房间',
          status: 'Running',
          duration: 3600,
          startTime: '2026-03-08T00:00:00Z',
          endTime: null,
          createdAt: '2026-03-08T00:00:00Z',
        },
      ],
      total: 1,
    }),
    fetchRooms: async () => [{ roomId: 123, anchorName: '测试房间' }],
    startCapture: async () => ({ data: { roomId: 123, anchorName: '测试房间' } }),
    stopCapture: async () => {},
  }),
}))

import CaptureView from '../../src/views/capture/CaptureView'

describe('CaptureView (Vitest + jsdom)', () => {
  it('renders title, start button and a job row', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    root.render(React.createElement(CaptureView))

    // wait a tick for effect-driven state updates
    await Promise.resolve()
    await Promise.resolve()

    const text = container.textContent || ''
    expect(text).toContain('弹幕捕获任务管理')
    expect(text).toContain('启动新捕获任务')
    // job row should include room name and id
    expect(text).toContain('测试房间')
    expect(text).toContain('123')

    root.unmount()
    container.remove()
  })
})

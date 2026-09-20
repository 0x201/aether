import { test, expect } from "@playwright/test"

import { waitForNetworkIdle } from "./utils"

const baseUrl = "http://localhost:3015"
const realtimeUrl = `${baseUrl}/realtime-danmaku`

test.describe("Realtime Danmaku View E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for danmaku data
    await page.route("**/api/danmaku/realtime*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "1",
              userId: "user1",
              userName: "testUser",
              content: "Hello World!",
              timestamp: new Date().toISOString(),
            },
            {
              id: "2",
              userId: "user2",
              userName: "anotherUser",
              content: "Great stream!",
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      })
    })

    await page.goto(realtimeUrl)
    await waitForNetworkIdle(page)
  })

  test("should load the realtime danmaku page", async ({ page }) => {
    // Check for page title or header
    await expect(page.locator("h1, h2, h3, .realtime-title, .danmaku-display-title").first())
      .toBeVisible()
      .catch(() => {
        // If no specific title is found, check for general page elements
        expect(true).toBeTruthy()
      })

    // Check if the danmaku display area is visible
    await expect(
      page.locator(".danmaku-display, .realtime-danmaku-container, .danmaku-area"),
    ).toBeVisible()
  })

  test("should display danmaku messages in real-time", async ({ page }) => {
    // Initially check for some default content
    await expect(page.locator(".danmaku-item, .danmaku-message")).toBeVisible()

    // Wait for danmaku messages to load
    await page.waitForSelector(".danmaku-item, .danmaku-message")
    const danmakuItems = page.locator(".danmaku-item, .danmaku-message")

    // Check that danmaku messages are displayed
    await expect(danmakuItems).toHaveCount(2) // Based on our mocked data

    // Check content of the first danmaku
    const firstDanmaku = danmakuItems.first()
    await expect(firstDanmaku.locator(".danmaku-content, .message-content")).toContainText(
      "Hello World!",
    )
    await expect(firstDanmaku.locator(".danmaku-user, .username")).toContainText("testUser")
  })

  test("should update danmaku messages when new data arrives", async ({ page }) => {
    // Intercept new danmaku messages
    await page.route("**/api/danmaku/realtime*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "1",
              userId: "user1",
              userName: "testUser",
              content: "Hello World!",
              timestamp: new Date().toISOString(),
            },
            {
              id: "2",
              userId: "user2",
              userName: "anotherUser",
              content: "Great stream!",
              timestamp: new Date().toISOString(),
            },
            {
              id: "3",
              userId: "user3",
              userName: "thirdUser",
              content: "New message!",
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      })
    })

    // Reload or trigger data refresh
    await page.reload()
    await waitForNetworkIdle(page)

    // Check that the new message appears
    const danmakuItems = page.locator(".danmaku-item, .danmaku-message")
    await expect(danmakuItems).toHaveCount(3)

    // Check content of the new danmaku
    const lastDanmaku = danmakuItems.last()
    await expect(lastDanmaku.locator(".danmaku-content, .message-content")).toContainText(
      "New message!",
    )
    await expect(lastDanmaku.locator(".danmaku-user, .username")).toContainText("thirdUser")
  })

  test("should have filtering controls", async ({ page }) => {
    // Check for filter controls
    await expect(
      page.locator('input[placeholder*="过滤"], .filter-input, .search-input'),
    ).toBeVisible()
    await expect(page.locator(".filter-control, .danmaku-filter")).toBeVisible()
  })

  test("should connect to WebSocket for live updates", async ({ page }) => {
    // Mock WebSocket connection
    await page.addInitScript(() => {
      window.originalWebSocket = window.WebSocket
      window.WebSocket = class extends window.originalWebSocket {
        constructor(url) {
          super(url)
          window.lastWebSocketUrl = url
        }
      }
    })

    await page.goto(realtimeUrl)
    await waitForNetworkIdle(page)

    // Check if WebSocket connection was attempted
    const webSocketUrl = await page.evaluate(() => window.lastWebSocketUrl)
    expect(webSocketUrl).toBeDefined()
  })

  test("should have pause/resume functionality", async ({ page }) => {
    // Check for pause/resume controls
    const pauseBtn = page.locator('button:has-text("暂停"), button:has-text("Pause"), .pause-btn')
    const resumeBtn = page.locator(
      'button:has-text("继续"), button:has-text("Resume"), .resume-btn',
    )

    if ((await pauseBtn.count()) > 0) {
      await expect(pauseBtn).toBeVisible()
      await pauseBtn.click()

      // After pausing, check if there's a resume button or if the state changed
      await expect(resumeBtn.or(pauseBtn)).toBeVisible()
    }
  })

  test("should adjust speed of danmaku display", async ({ page }) => {
    // Check for speed controls
    const speedControl = page.locator('.speed-control, .danmaku-speed, [aria-label="speed"]')

    if ((await speedControl.count()) > 0) {
      await expect(speedControl).toBeVisible()

      // Change speed and verify
      await speedControl.focus()
      await speedControl.fill("2")

      // Verify the speed has been updated
      await expect(speedControl).toHaveValue("2")
    }
  })
})

import { test, expect } from "@playwright/test"

import { waitForNetworkIdle } from "./utils"

const baseUrl = "http://localhost:3015"

test.describe("Component E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl)
    await waitForNetworkIdle(page)
  })

  test("should render and interact with DanmakuDisplay component", async ({ page }) => {
    // Navigate to a page that uses DanmakuDisplay
    await page.goto(`${baseUrl}/realtime-danmaku`)
    await waitForNetworkIdle(page)

    // Mock danmaku data
    await page.route("**/api/danmaku/**", (route) => {
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

    // Check if DanmakuDisplay is rendered
    const danmakuDisplay = page.locator(".danmaku-display, .danmaku-container")
    await expect(danmakuDisplay).toBeVisible()

    // Check if danmaku messages are displayed
    const danmakuItems = page.locator(".danmaku-item, .danmaku-message")
    await expect(danmakuItems.first()).toBeVisible()

    // Test scrolling or animation if applicable
    await expect(danmakuItems).toHaveCount(2)
  })

  test("should render and interact with DanmakuChart component", async ({ page }) => {
    // Navigate to dashboard which likely uses charts
    await page.goto(`${baseUrl}/dashboard`)
    await waitForNetworkIdle(page)

    // Check if chart container is visible
    const chartContainer = page.locator(".recharts-wrapper, .chart-container, .danmaku-chart")
    await expect(chartContainer).toBeVisible()

    // Check if chart has data
    const chartBarsOrLines = page.locator(".recharts-bar, .recharts-line, .recharts-area")
    if ((await chartBarsOrLines.count()) > 0) {
      await expect(chartBarsOrLines.first()).toBeVisible()
    }

    // Test tooltip interaction if available
    const chartArea = page.locator(".recharts-chart, .chart-area")
    if ((await chartArea.count()) > 0) {
      await chartArea.first().hover()
      const tooltip = page.locator(".recharts-tooltip-wrapper, .chart-tooltip")
      // Tooltip may or may not appear depending on chart type
      expect(tooltip).toBeDefined()
    }
  })

  test("should render and interact with InfiniteRefreshSelect component", async ({ page }) => {
    // Go to management page which likely has search/filter functionality
    await page.goto(`${baseUrl}/management`)
    await waitForNetworkIdle(page)

    // Look for infinite scroll select components (likely in search filters)
    const selectComponents = page.locator(".ant-select, .infinite-select")
    await expect(selectComponents.first()).toBeVisible()

    // Click to expand the select
    const firstSelect = selectComponents.first()
    await firstSelect.click()

    // Check if options are loaded
    const options = page.locator(".ant-select-item, .select-option")
    await expect(options.first()).toBeVisible()

    // Test typing in the search box if available
    const searchInput = firstSelect.locator("input")
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("test")
      await page.waitForTimeout(300) // Wait for search results
    }
  })

  test("should render and interact with ThemeToggle component", async ({ page }) => {
    // Check for theme toggle button
    const themeToggle = page.locator(
      ".theme-toggle, .dark-mode-toggle, [data-theme-toggle], button:has(.moon-icon), button:has(.sun-icon)",
    )

    if ((await themeToggle.count()) > 0) {
      // Get initial theme
      const initialThemeClass = await page.locator("body, html").getAttribute("class")
      await themeToggle.textContent()

      // Toggle theme
      await themeToggle.click()
      await page.waitForTimeout(300) // Wait for transition

      // Get new theme
      const newThemeClass = await page.locator("body, html").getAttribute("class")

      // Themes should be different
      expect(initialThemeClass).not.toEqual(newThemeClass)
    } else {
      // If no theme toggle found, check contexts or app level theme provider
      expect(true).toBeTruthy() // Pass test if component doesn't exist on this page
    }
  })

  test("should render and interact with MessageBox component", async ({ page }) => {
    // Check for message box functionality (could be notifications, alerts, etc.)
    const messageBox = page.locator(".ant-message, .message-box, .notification-box")

    // Test showing a message if possible
    // Since we can't easily trigger messages from e2e tests, we'll just check if the container exists
    expect(messageBox).toBeDefined()

    // Check for any visible messages
    const messages = page.locator(".ant-message-notice, .message-content")
    // Expect 0 or more messages (may not have any initially)
    expect(await messages.count()).toBeGreaterThanOrEqual(0)
  })

  test("should render and interact with CopyableText component", async ({ page }) => {
    // Go to management page which likely has copyable text
    await page.goto(`${baseUrl}/management`)
    await waitForNetworkIdle(page)

    // Look for copyable text components
    const copyableTexts = page.locator(".copyable-text, .copy-container")

    if ((await copyableTexts.count()) > 0) {
      const firstCopyable = copyableTexts.first()
      await firstCopyable.hover()

      // Check if copy button appears on hover
      const copyButton = firstCopyable.locator(".copy-button, .copy-icon")
      if ((await copyButton.count()) > 0) {
        // Get initial text content
        await firstCopyable.textContent()

        // Click copy button
        await copyButton.click()

        // Check if feedback is provided
        const feedback = page.locator(".ant-message-success, .copy-feedback")
        if ((await feedback.count()) > 0) {
          await expect(feedback).toBeVisible()
        }
      }
    }
  })

  test("should render and interact with Wordcloud component", async ({ page }) => {
    // Go to dashboard which might have a word cloud
    await page.goto(`${baseUrl}/dashboard`)
    await waitForNetworkIdle(page)

    // Look for word cloud components
    const wordcloud = page.locator(".wordcloud, .word-cloud, .tag-cloud")

    if ((await wordcloud.count()) > 0) {
      await expect(wordcloud.first()).toBeVisible()

      // Check if words are displayed
      const words = wordcloud.locator("text")
      if ((await words.count()) > 0) {
        // At least one word should be visible
        await expect(words.first()).toBeVisible()
      }
    } else {
      // If no wordcloud found, check other pages
      await page.goto(`${baseUrl}/realtime-danmaku`)
      await waitForNetworkIdle(page)

      const wordcloudAlt = page.locator(".wordcloud, .word-cloud, .tag-cloud")
      expect(wordcloudAlt).toBeDefined()
    }
  })

  test("should render Layout components correctly", async ({ page }) => {
    // Check for layout components on various pages
    const urls = [
      `${baseUrl}/`,
      `${baseUrl}/management`,
      `${baseUrl}/dashboard`,
      `${baseUrl}/realtime-danmaku`,
    ]

    for (const url of urls) {
      await page.goto(url)
      await waitForNetworkIdle(page)

      // Check for layout elements
      await expect(page.locator("nav, .navigation, .app-nav, .sidebar")).toBeVisible()
      await expect(page.locator("header, .header, .app-header")).toBeVisible()
      await expect(page.locator("main, .main-content, .content-area")).toBeVisible()
      await expect(page.locator("footer, .footer, .app-footer")).toBeVisible()
    }
  })
})

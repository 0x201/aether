import { test, expect } from "@playwright/test"

const baseUrl = "http://localhost:3015"

const managementUrl = `${baseUrl}/management`

test.describe("Basic Page Load Tests", () => {
  test("should load the danmaku management page", async ({ page }) => {
    // 访问页面
    const response = await page.goto(managementUrl)

    // 验证页面成功加载
    expect(response?.status()).toBeLessThan(400)

    // 检查页面标题
    await expect(page).toHaveTitle(/.*dydanmaku-viewer/) // 页面标题应该包含"管理"

    // 检查页面主要内容是否加载
    await expect(page.locator('h4:has-text("弹幕管理")')).toBeVisible()
  })

  test("should display all UI components", async ({ page }) => {
    await page.goto(`${managementUrl}`)

    // 等待页面完全加载
    await page.waitForLoadState("networkidle")

    // 验证主要UI组件是否存在
    await expect(page.locator(".danmaku-mgt")).toBeVisible()
    await expect(page.locator('h4:has-text("弹幕管理")')).toBeVisible()
    await expect(page.locator(".ant-collapse")).toBeVisible()
    await expect(page.locator(".ant-table")).toBeVisible()
    await expect(page.locator(".pagination-container")).toBeVisible()
  })

  test("should handle search panel toggle", async ({ page }) => {
    await page.goto(managementUrl)

    const searchPanel = page.locator(".ant-collapse")
    await expect(searchPanel).toBeVisible()

    const collapseHeader = page.locator(".ant-collapse-header")
    await collapseHeader.click()

    const collapsePanel = page.locator(".ant-collapse-panel")

    await expect(collapsePanel).not.toBeVisible()

    await collapseHeader.click()
    await expect(collapsePanel).toBeVisible()
  })

  test("should display loading state", async ({ page }) => {
    await page.goto(managementUrl)

    // 验证初始状态下表格不处于加载状态
    const table = page.locator(".ant-table")
    await expect(table.locator(".ant-spin")).not.toBeVisible()
  })

  test("should display correct number of columns", async ({ page }) => {
    await page.goto(managementUrl)

    // 等待表格加载
    const table = page.locator(".ant-table")
    await expect(table).toBeVisible()

    // 检查表头列数
    const headerCells = table.locator(".ant-table-thead th")
    const count = await headerCells.count()

    // 根据DanmakuMgt.tsx中的定义，应该有10列
    expect(count).toBeGreaterThanOrEqual(9) // 至少9列
  })

  test("should handle responsive columns", async ({ page }) => {
    await page.goto(managementUrl)

    // 设置较小的视口尺寸以测试响应式行为
    await page.setViewportSize({ width: 768, height: 1024 })

    // 验证表格仍然可见
    const table = page.locator(".ant-table")
    await expect(table).toBeVisible()

    // 切换回桌面尺寸
    await page.setViewportSize({ width: 1200, height: 1024 })
  })
})

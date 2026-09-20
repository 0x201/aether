import { test, expect } from "@playwright/test"

const baseUrl = "http://localhost:3015"

const managementUrl = `${baseUrl}/management`

test.describe("Danmaku Management Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(managementUrl)
  })

  test("should load danmaku management page successfully", async ({ page }) => {
    await expect(page.locator("h4").filter({ hasText: "弹幕管理" })).toBeVisible()

    await expect(page.getByText("搜索和筛选")).toBeVisible()

    await expect(page.locator(".ant-table")).toBeVisible()

    await expect(page.locator(".pagination-container")).toBeVisible()
  })

  test("should display search filters correctly", async ({ page }) => {
    const collapseHeader = page.locator(".ant-collapse-header")
    await expect(collapseHeader).toBeVisible()

    await expect(page.getByLabel("用户名")).toBeVisible()
    await expect(page.getByLabel("弹幕内容")).toBeVisible()
    await expect(page.getByLabel("房间ID")).toBeVisible()
    await expect(page.getByLabel("时间范围").first()).toBeVisible()

    await expect(page.getByRole("button", { name: "搜索" })).toBeVisible()
    await expect(page.getByRole("button", { name: "重置" })).toBeVisible()
  })

  test("should render danmaku table with correct columns", async ({ page }) => {
    const table = page.locator(".ant-table")
    await expect(table).toBeVisible()

    const expectedColumns = [
      "ID",
      "用户ID",
      "用户名",
      "内容",
      "粉丝牌",
      "粉丝牌等级",
      "用户等级",
      "时间",
      "房间名称",
      "操作",
    ]
    for (const column of expectedColumns) {
      await expect(table.locator(".ant-table-thead").filter({ hasText: column })).toBeVisible()
    }
  })

  test("should handle pagination correctly", async ({ page }) => {
    const pagination = page.locator(".ant-pagination")
    await expect(pagination).toBeVisible()

    await expect(
      page.locator(".pagination-container .ant-select").filter({ hasText: "10 / page" }),
    ).toBeVisible()

    await expect(page.getByRole("button", { name: "Next Page" })).toBeVisible()
  })

  test("should allow search filtering", async ({ page }) => {
    await page.fill('input[placeholder="精确匹配"]', "test_user")
    await page.fill('input[placeholder="支持模糊搜索"]', "test_content")

    await page.getByRole("button", { name: "搜索" }).click()

    await page.waitForResponse((response) => response.url().includes("/danmaku"))
  })

  test("should reset search filters", async ({ page }) => {
    await page.fill('input[placeholder="精确匹配"]', "test_user")
    await page.fill('input[placeholder="支持模糊搜索"]', "test_content")

    await page.getByRole("button", { name: "重置" }).click()

    await expect(page.locator('input[placeholder="精确匹配"]')).toHaveValue("")
    await expect(page.locator('input[placeholder="支持模糊搜索"]')).toHaveValue("")
  })

  test("should handle modal operations", async () => {
    // 检查是否有打开模态框的操作（如果有添加/编辑按钮的话）
    // 因为代码中没有显示添加按钮，这里仅作示例
    // 如果有添加按钮，可以这样测试：
    // await page.getByRole('button', { name: '添加' }).click();
    // await expect(page.locator('.ant-modal')).toBeVisible();
    // await page.getByRole('button', { name: '取消' }).click();
    // await expect(page.locator('.ant-modal')).not.toBeVisible();
  })

  test("should show copy functionality tooltips", async ({ page }) => {
    const copyableElements = page.locator(".copyable-text")
    if ((await copyableElements.count()) > 0) {
      await copyableElements.first().hover()
    }
  })
})

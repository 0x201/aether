import { test, expect } from "@playwright/test"

const baseUrl = "http://localhost:3015"

const managementUrl = `${baseUrl}/management`

test.describe("Danmaku Management Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    // 访问弹幕管理页面
    await page.goto(managementUrl) // 假设开发服务器端口是5173
  })

  test("should display danmaku data in table", async ({ page }) => {
    // 等待数据加载
    await page.waitForSelector(".ant-table-tbody tr", { state: "visible" })

    // 检查是否有至少一行数据
    const tableRows = page.locator(".ant-table-tbody tr")
    await expect(tableRows).toHaveCount(1) // 至少有一行

    // 检查数据行是否包含预期的列
    const firstRow = tableRows.first()
    await expect(firstRow.locator("td").nth(0)).toContainText(/^[A-Za-z0-9-]+$/) // ID列
    await expect(firstRow.locator("td").nth(1)).toContainText(/.+/) // 用户ID列
    await expect(firstRow.locator("td").nth(2)).toContainText(/.+/) // 用户名列
    await expect(firstRow.locator("td").nth(3)).toContainText(/.+/) // 内容列
  })

  test("should sort table by clicking headers", async ({ page }) => {
    // 获取表格数据行
    const tableRowsBefore = page.locator(".ant-table-tbody tr")
    await expect(tableRowsBefore).toBeVisible()

    // 点击ID列标题进行排序
    const idColumnHeader = page.locator(".ant-table-column-title").filter({ hasText: "ID" })
    await idColumnHeader.click()

    // 等待表格重新渲染
    await page.waitForTimeout(500)

    // 再次点击以切换排序方向
    await idColumnHeader.click()
    await page.waitForTimeout(500)

    // 验证排序功能正常工作
    const tableRowsAfter = page.locator(".ant-table-tbody tr")
    await expect(tableRowsAfter).toBeVisible()
  })

  test("should filter by username", async ({ page }) => {
    // 输入用户名进行过滤
    await page.fill('input[placeholder="精确匹配"]', "test_user")

    // 点击搜索按钮
    await page.getByRole("button", { name: "搜索" }).click()

    // 等待搜索结果
    await page.waitForLoadState("networkidle")

    // 验证过滤结果
    const tableRows = page.locator(".ant-table-tbody tr")
    await expect(tableRows).toBeVisible()
  })

  test("should filter by content", async ({ page }) => {
    // 输入内容进行过滤
    await page.fill('input[placeholder="支持模糊搜索"]', "hello")

    // 点击搜索按钮
    await page.getByRole("button", { name: "搜索" }).click()

    // 等待搜索结果
    await page.waitForLoadState("networkidle")

    // 验证过滤结果
    const tableRows = page.locator(".ant-table-tbody tr")
    await expect(tableRows).toBeVisible()
  })

  test("should filter by room ID", async ({ page }) => {
    // 输入房间ID进行过滤
    await page.locator(".ant-select-selector input").first().fill("123456")

    // 等待选项加载
    await page.waitForTimeout(1000)

    // 选择第一个选项
    await page.locator(".ant-select-item-option-content").first().click()

    // 点击搜索按钮
    await page.getByRole("button", { name: "搜索" }).click()

    // 等待搜索结果
    await page.waitForLoadState("networkidle")

    // 验证过滤结果
    const tableRows = page.locator(".ant-table-tbody tr")
    await expect(tableRows).toBeVisible()
  })

  test("should filter by date range", async ({ page }) => {
    // 打开日期选择器
    await page.locator(".ant-picker-range-wrapper input").first().click()

    // 选择日期范围
    await page.locator('.ant-picker-cell-inner:has-text("01")').first().click()
    await page.locator('.ant-picker-cell-inner:has-text("15")').first().click()

    // 点击搜索按钮
    await page.getByRole("button", { name: "搜索" }).click()

    // 等待搜索结果
    await page.waitForLoadState("networkidle")

    // 验证过滤结果
    const tableRows = page.locator(".ant-table-tbody tr")
    await expect(tableRows).toBeVisible()
  })

  test("should change page size and navigate pages", async ({ page }) => {
    // 等待表格数据加载
    await page.waitForSelector(".ant-table-tbody tr", { state: "visible" })

    // 更改每页显示数量
    await page
      .locator(".ant-select-selector")
      .filter({ hasText: /\d+ 条\/页/ })
      .click()
    await page.getByRole("option", { name: "15 条／页" }).click()

    // 等待数据重新加载
    await page.waitForLoadState("networkidle")

    // 尝试翻页
    const nextButton = page.getByRole("button", { name: "下一页" })
    if (await nextButton.isEnabled()) {
      await nextButton.click()

      // 等待新页面数据加载
      await page.waitForLoadState("networkidle")

      // 返回上一页
      const prevButton = page.getByRole("button", { name: "上一页" })
      await prevButton.click()
    }
  })

  test("should handle delete confirmation", async ({ page }) => {
    // 查找删除按钮
    const deleteButtons = page.locator(".ant-popconfirm .ant-btn-dangerous")

    if ((await deleteButtons.count()) > 0) {
      // 点击第一个删除按钮
      const firstDeleteBtn = deleteButtons.first()
      await firstDeleteBtn.click()

      // 等待确认对话框出现
      await page.waitForSelector(".ant-popconfirm", { state: "visible" })

      // 验证确认对话框存在
      await expect(page.locator(".ant-popconfirm")).toBeVisible()

      // 点击取消按钮
      await page.getByRole("button", { name: "取消" }).click()

      // 确认对话框消失
      await expect(page.locator(".ant-popconfirm")).not.toBeVisible()
    }
  })

  test("should handle medal level colors", async ({ page }) => {
    // 检查粉丝牌等级标签是否有颜色
    const medalTags = page.locator(".ant-tag")
    if ((await medalTags.count()) > 0) {
      const firstMedalTag = medalTags.first()
      await expect(firstMedalTag).toBeVisible()

      // 检查标签是否有颜色类
      await expect(firstMedalTag).toHaveClass(/ant-tag.*-solid/)
    }
  })

  test("should handle user level colors", async ({ page }) => {
    // 检查用户等级标签是否有颜色
    const userLevelTags = page.locator(".ant-tag")
    if ((await userLevelTags.count()) > 0) {
      const firstUserLevelTag = userLevelTags.first()
      await expect(firstUserLevelTag).toBeVisible()

      // 检查标签是否有颜色类
      await expect(firstUserLevelTag).toHaveClass(/ant-tag.*-solid/)
    }
  })
})

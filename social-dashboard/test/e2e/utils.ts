/**
 * 测试辅助工具函数
 */

import { Page } from "@playwright/test"

/**
 * 等待网络空闲
 * @param page 页面实例
 * @param timeout 超时时间
 */
export async function waitForNetworkIdle(page: Page) {
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1000) // 额外等待1秒确保数据加载完成
}

/**
 * 填充搜索表单并提交
 * @param page 页面实例
 * @param searchParams 搜索参数
 */
export async function performSearch(
  page: Page,
  searchParams?: {
    userName?: string
    content?: string
    roomId?: string
    timeRange?: [Date, Date]
  },
) {
  if (searchParams?.userName) {
    await page.fill('input[placeholder="精确匹配"]', searchParams.userName)
  }

  if (searchParams?.content) {
    await page.fill('input[placeholder="支持模糊搜索"]', searchParams.content)
  }

  if (searchParams?.roomId) {
    // 填入房间ID
    await page.locator(".ant-select-selector input").nth(0).fill(searchParams.roomId)
    await page.waitForTimeout(1000) // 等待选项加载

    // 选择第一个匹配项
    const options = page.locator(".ant-select-item-option")
    if ((await options.count()) > 0) {
      await options.first().click()
    }
  }

  if (searchParams?.timeRange) {
    // 打开日期选择器
    const datePickerInputs = page.locator(".ant-picker-range-wrapper input")
    await datePickerInputs.first().click()

    // 选择日期
    const [startDate, endDate] = searchParams.timeRange
    const startDay = startDate.getDate().toString()
    const endDay = endDate.getDate().toString()

    await page.locator(`.ant-picker-cell-inner:has-text("${startDay}")`).first().click()
    await page.locator(`.ant-picker-cell-inner:has-text("${endDay}")`).first().click()
  }

  // 点击搜索按钮
  await page.getByRole("button", { name: "搜索" }).click()

  // 等待搜索结果
  await waitForNetworkIdle(page)
}

/**
 * 重置搜索表单
 * @param page 页面实例
 */
export async function resetSearch(page: Page) {
  await page.getByRole("button", { name: "重置" }).click()
  await waitForNetworkIdle(page)
}

/**
 * 检查表格中是否包含特定文本
 * @param page 页面实例
 * @param text 要搜索的文本
 * @returns 是否找到文本
 */
export async function hasTextInTable(page: Page, text: string): Promise<boolean> {
  const table = page.locator(".ant-table-tbody")
  const rows = table.locator("tr")
  const rowCount = await rows.count()

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i)
    const hasText = await row.locator(`text=${text}`).isVisible()
    if (hasText) {
      return true
    }
  }

  return false
}

/**
 * 获取表格行数
 * @param page 页面实例
 * @returns 表格行数
 */
export async function getTableRowCount(page: Page): Promise<number> {
  const rows = page.locator(".ant-table-tbody tr")
  return await rows.count()
}

/**
 * 模拟键盘快捷键
 * @param page 页面实例
 * @param keys 键盘按键组合
 */
export async function pressKeys(page: Page, keys: string) {
  await page.keyboard.press(keys)
}

import { test, expect } from '@playwright/test'
import {
  waitForNetworkIdle,
  performSearch,
  resetSearch,
  getTableRowCount,
  pressKeys,
} from './utils'

const baseUrl = 'http://localhost:3015'
const managementUrl = `${baseUrl}/management`

test.describe('Advanced Danmaku Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(managementUrl)
    await waitForNetworkIdle(page)
  })

  test('should perform complex search operations', async ({ page }) => {
    const initialRowCount = await getTableRowCount(page)

    await performSearch(page, {
      userName: 'test_user',
      content: 'hello',
      timeRange: [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()],
    })

    const searchRowCount = await getTableRowCount(page)
    expect(searchRowCount).toBeLessThanOrEqual(initialRowCount)

    await resetSearch(page)

    const resetRowCount = await getTableRowCount(page)
    expect(resetRowCount).toBe(initialRowCount)
  })

  test('should filter by room ID correctly', async ({ page }) => {
    await getTableRowCount(page)

    await performSearch(page, {
      roomId: '123456',
    })

    const filteredRowCount = await getTableRowCount(page)

    if (filteredRowCount > 0) {
      const table = page.locator('.ant-table-tbody')
      const roomCells = table.locator('td:nth-child(10)')

      const cellCount = await roomCells.count()
      for (let i = 0; i < cellCount; i++) {
        const cell = roomCells.nth(i)
        const text = await cell.textContent()
        if (text && text.trim() !== '无') {
          expect(text).toContain('123456')
        }
      }
    }
  })

  test('should maintain search state during pagination', async ({ page }) => {
    await performSearch(page, {
      content: 'test',
    })

    const pagination = page.locator('.ant-pagination')
    if (await pagination.isVisible()) {
      const nextButton = page.getByRole('button', { name: '下一页' })

      if (await nextButton.isEnabled()) {
        const searchInput = page.locator('input[placeholder="支持模糊搜索"]')
        const searchValue = await searchInput.inputValue()

        await nextButton.click()
        await waitForNetworkIdle(page)

        const newSearchValue = await searchInput.inputValue()
        expect(newSearchValue).toBe(searchValue)

        const currentRowCount = await getTableRowCount(page)
        expect(currentRowCount).toBeGreaterThan(0)
      }
    }
  })

  test('should handle keyboard navigation', async ({ page }) => {
    await pressKeys(page, 'Tab')
    await pressKeys(page, 'Tab')

    const focusedElement = page.locator(':focus')
    expect(await focusedElement.count()).toBe(1)
  })

  test('should correctly display fan medal colors', async ({ page }) => {
    const medalTags = page.locator('.ant-table-tbody td:nth-child(6) .ant-tag')
    const tagCount = await medalTags.count()

    if (tagCount > 0) {
      for (let i = 0; i < tagCount; i++) {
        const tag = medalTags.nth(i)
        const textContent = await tag.textContent()

        if (textContent && textContent !== '无') {
          await expect(tag).toHaveClass(/ant-tag.*-solid/)
        }
      }
    }
  })

  test('should correctly display user level colors', async ({ page }) => {
    const levelTags = page.locator('.ant-table-tbody td:nth-child(7) .ant-tag') // 第7列是用户等级
    const tagCount = await levelTags.count()

    if (tagCount > 0) {
      for (let i = 0; i < tagCount; i++) {
        const tag = levelTags.nth(i)
        const textContent = await tag.textContent()

        if (textContent && textContent !== '无') {
          await expect(tag).toHaveClass(/ant-tag.*-solid/)
        }
      }
    }
  })

  test('should handle copy functionality', async ({ page }) => {
    // 测试可复制文本组件
    const copyableElements = page.locator('.copyable-text')
    const elementCount = await copyableElements.count()

    if (elementCount > 0) {
      // 测试第一个可复制元素
      const firstElement = copyableElements.first()
      await firstElement.textContent()

      // 悬停以显示复制按钮
      await firstElement.hover()

      // 检查复制按钮是否出现
      const copyButton = firstElement.locator('.copy-button')
      if ((await copyButton.count()) > 0) {
        await copyButton.click()

        // 验证复制成功提示
        await expect(page.locator('.ant-message-success')).toBeVisible()
      }
    }
  })

  test('should respond to sorting changes', async ({ page }) => {
    // 点击第一列标题进行排序
    const firstColumnHeader = page.locator('.ant-table-thead th').first()
    await firstColumnHeader.click()

    // 等待排序完成
    await page.waitForTimeout(1000)

    // 再次点击以切换排序方向
    await firstColumnHeader.click()
    await page.waitForTimeout(1000)

    // 检查表格数据是否已更新
    const rowsAfterSort = await getTableRowCount(page)
    expect(rowsAfterSort).toBeGreaterThan(0)
  })
})

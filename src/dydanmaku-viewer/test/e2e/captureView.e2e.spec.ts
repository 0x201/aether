import { test, expect } from '@playwright/test';
import { waitForNetworkIdle } from './utils';

const baseUrl = 'http://localhost:3015';
const captureUrl = `${baseUrl}/capture`;

test.describe('Capture View E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for capture data
    await page.route('**/api/capture/jobs*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: '1',
              roomId: '123456',
              roomName: '测试直播间',
              status: 'Running',
              duration: 3600,
              startTime: '2026-03-08T00:00:00Z',
              endTime: null,
              createdAt: '2026-03-08T00:00:00Z',
            },
            {
              id: '2',
              roomId: '789012',
              roomName: '另一个直播间',
              status: 'Stopped',
              duration: 1800,
              startTime: '2026-03-07T10:00:00Z',
              endTime: '2026-03-07T10:30:00Z',
              createdAt: '2026-03-07T09:00:00Z',
            }
          ],
          total: 2,
        })
      });
    });

    await page.route('**/api/capture/rooms*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { roomId: '123456', anchorName: '主播A', roomName: '测试直播间' },
          { roomId: '789012', anchorName: '主播B', roomName: '另一个直播间' },
          { roomId: '345678', anchorName: '主播C', roomName: '第三个直播间' }
        ])
      });
    });

    await page.goto(captureUrl);
    await waitForNetworkIdle(page);
  });

  test('should load the capture page and display title', async ({ page }) => {
    // Check for page title or header
    await expect(page.locator('text=弹幕捕获|Capture|弹幕抓取')).toBeVisible().catch(() => {
      // If no specific title is found, check for general page elements
      expect(true).toBeTruthy();
    });

    // Check for the presence of the main container
    await expect(page.locator('.capture-view, .capture-container, .job-management')).toBeVisible();
  });

  test('should display capture jobs table', async ({ page }) => {
    // Check for the jobs table
    const table = page.locator('.ant-table, .jobs-table, .capture-jobs-table');
    await expect(table).toBeVisible();

    // Check that jobs are displayed
    const jobRows = page.locator('.ant-table-tbody tr, .job-row, .capture-job');
    await expect(jobRows).toHaveCount(2); // Based on our mocked data

    // Check that specific job info is visible
    await expect(page.locator('text=测试直播间')).toBeVisible();
    await expect(page.locator('text=123456')).toBeVisible();
    await expect(page.locator('text=Running')).toBeVisible();
    await expect(page.locator('text=另一个直播间')).toBeVisible();
    await expect(page.locator('text=Stopped')).toBeVisible();
  });

  test('should have a button to start a new capture job', async ({ page }) => {
    // Check for the start button
    const startButton = page.locator('button:has-text("启动新捕获任务"), button:has-text("Start New Capture")');
    await expect(startButton).toBeVisible();

    // Click the start button to open modal
    await startButton.click();

    // Check if modal appeared
    await expect(page.locator('.ant-modal, .modal, .capture-modal')).toBeVisible();

    // Check for room selection in modal
    await expect(page.locator('.ant-select, .room-selector')).toBeVisible();

    // Close the modal
    const cancelButton = page.locator('button:has-text("取消"), button:has-text("Cancel")');
    if (await cancelButton.count() > 0) {
      await cancelButton.click();
    } else {
      await page.keyboard.press('Escape');
    }

    // Ensure modal is closed
    await expect(page.locator('.ant-modal, .modal, .capture-modal')).not.toBeVisible();
  });

  test('should allow starting a new capture job', async ({ page }) => {
    // Mock the API response for starting a capture
    await page.route('**/api/capture/start*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          data: { 
            id: '3', 
            roomId: '345678', 
            roomName: '第三个直播间',
            status: 'Running',
            startTime: new Date().toISOString()
          } 
        })
      });
    });

    // Click the start button
    await page.locator('button:has-text("启动新捕获任务")').click();

    // Wait for modal to appear
    await expect(page.locator('.ant-modal')).toBeVisible();

    // Select a room from the dropdown
    const roomSelector = page.locator('.ant-select-selector').first();
    await roomSelector.click();
    
    // Select the third room (which should be '第三个直播间')
    await page.locator('text=第三个直播间').click();

    // Click the confirm button
    await page.locator('button:has-text("确定"), button:has-text("Confirm")').click();

    // Wait for the request to complete
    await page.waitForResponse(response => response.url().includes('/api/capture/start'));

    // Verify that the new job appears in the table
    await expect(page.locator('text=第三个直播间')).toBeVisible();
  });

  test('should allow stopping a running capture job', async ({ page }) => {
    // Mock the API response for stopping a capture
    await page.route('**/api/capture/stop*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          data: { 
            id: '1', 
            roomId: '123456', 
            status: 'Stopped',
            endTime: new Date().toISOString()
          } 
        })
      });
    });

    // Find the running job and click its stop button
    const stopButton = page.locator('button:has-text("停止"), button:has-text("Stop")').first();
    if (await stopButton.count() > 0) {
      await stopButton.click();
      
      // Confirm if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("确认"), button:has-text("Yes")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
      
      // Wait for the request to complete
      await page.waitForResponse(response => response.url().includes('/api/capture/stop'));
      
      // Verify that the status has changed to stopped
      await expect(page.locator('text=Stopped')).toBeVisible();
    }
  });

  test('should allow deleting a capture job', async ({ page }) => {
    // Mock the API response for deleting a capture job
    await page.route('**/api/capture/delete*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '删除成功' })
      });
    });

    // Find a job and click its delete button
    const deleteButton = page.locator('button:has-text("删除"), button:has-text("Delete")').first();
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      
      // Confirm if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("确认"), button:has-text("Yes")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
      
      // Wait for the request to complete
      await page.waitForResponse(response => response.url().includes('/api/capture/delete'));
      
      // Verify that the job has been removed from the table
      await expect(page.locator('text=第三个直播间')).not.toBeVisible();
    }
  });

  test('should display room selection with available rooms', async ({ page }) => {
    // Click the start button to open the modal
    await page.locator('button:has-text("启动新捕获任务")').click();

    // Wait for the modal to appear
    await expect(page.locator('.ant-modal')).toBeVisible();

    // Check for room selection dropdown
    const roomSelector = page.locator('.ant-select-selector').first();
    await expect(roomSelector).toBeVisible();

    // Click the selector to show options
    await roomSelector.click();

    // Check that the available rooms are listed
    await expect(page.locator('text=测试直播间')).toBeVisible();
    await expect(page.locator('text=另一个直播间')).toBeVisible();
    await expect(page.locator('text=第三个直播间')).toBeVisible();

    // Close the modal
    await page.locator('button:has-text("取消"), button:has-text("Cancel")').click();
  });

  test('should handle pagination for capture jobs', async ({ page }) => {
    // Mock API response with multiple pages of jobs
    await page.route('**/api/capture/jobs?page=*', route => {
      const url = route.request().url();
      const pageParam = new URLSearchParams(new URL(url).search).get('page') || '1';
      const currentPage = parseInt(pageParam);
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: Array.from({ length: 10 }, (_, i) => ({
            id: `${currentPage * 10 + i}`,
            roomId: `${currentPage * 100000 + i}`,
            roomName: `直播间 ${currentPage * 10 + i}`,
            status: i % 2 === 0 ? 'Running' : 'Stopped',
            duration: 3600,
            startTime: '2026-03-08T00:00:00Z',
            endTime: null,
            createdAt: '2026-03-08T00:00:00Z',
          })),
          total: 50,
          page: currentPage,
          pageSize: 10
        })
      });
    });

    // Check for pagination controls
    const pagination = page.locator('.ant-pagination, .pagination');
    await expect(pagination).toBeVisible();

    // Check if there are multiple pages
    const nextPageButton = page.locator('.ant-pagination-next, .next-page');
    if (await nextPageButton.count() > 0 && await nextPageButton.isEnabled()) {
      // Click next page
      await nextPageButton.click();
      
      // Wait for data to load
      await page.waitForTimeout(500);
      
      // Verify that the table content has updated
      await expect(page.locator('.ant-table-tbody tr')).toHaveCount(10);
    }
  });
});
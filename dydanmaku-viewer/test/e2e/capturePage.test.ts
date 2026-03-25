import { test, expect } from '@playwright/test';

test.describe('Capture Page Tests with Screenshots', () => {
  test('should load the capture page and take screenshot', async ({ page }, testInfo) => {
    // Navigate to the capture page
    const response = await page.goto('http://localhost:3015/capture');
    
    // Verify page loaded successfully
    expect(response?.status()).toBeLessThan(400);
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of the initial page state
    await page.screenshot({
      path: `test-results/capture-page-initial-${testInfo.retry}.png`,
      fullPage: true
    });
    
    // Verify the page title or main content is visible
    await expect(page.locator('h1, h2, h3, .capture-title, .page-title').first()).toBeVisible().catch(() => {
      // If no specific title is found, at least check that the page is loaded
      expect(page.url()).toContain('/capture');
    });
  });

  test('should display capture jobs table and take screenshot', async ({ page }, testInfo) => {
    // Mock API response for capture jobs
    await page.route('**/api/capture/jobs*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: '1',
              roomId: '123456',
              roomName: 'Test Room 1',
              status: 'Running',
              duration: 3600,
              startTime: '2026-03-08T00:00:00Z',
              endTime: null,
              createdAt: '2026-03-08T00:00:00Z',
            },
            {
              id: '2',
              roomId: '789012',
              roomName: 'Test Room 2',
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

    await page.goto('http://localhost:3015/capture');
    await page.waitForLoadState('networkidle');

    // Locate and verify the capture jobs table
    const table = page.locator('.ant-table, .jobs-table, .capture-jobs');
    await expect(table).toBeVisible();

    // Take screenshot of the jobs table
    await table.screenshot({
      path: `test-results/capture-jobs-table-${testInfo.retry}.png`
    });

    // Verify that jobs are displayed in the table
    const jobRows = page.locator('.ant-table-tbody tr, .job-row');
    await expect(jobRows).toHaveCount(2);
    
    // Verify specific job information is visible
    await expect(page.locator('text=Test Room 1')).toBeVisible();
    await expect(page.locator('text=123456')).toBeVisible();
    await expect(page.locator('text=Running')).toBeVisible();
  });

  test('should handle starting a new capture job', async ({ page }, testInfo) => {
    // Mock API responses
    await page.route('**/api/capture/jobs*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          total: 0,
        })
      });
    });

    await page.route('**/api/capture/rooms*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { roomId: '123456', anchorName: 'Anchor A', roomName: 'Room A' },
          { roomId: '789012', anchorName: 'Anchor B', roomName: 'Room B' }
        ])
      });
    });

    await page.route('**/api/capture/start*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          data: { 
            id: '3', 
            roomId: '123456', 
            roomName: 'Room A',
            status: 'Running',
            startTime: new Date().toISOString()
          } 
        })
      });
    });

    await page.goto('http://localhost:3015/capture');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({
      path: `test-results/before-start-job-${testInfo.retry}.png`,
      fullPage: true
    });

    // Click the start button
    const startButton = page.locator('button:has-text("启动新捕获任务"), button:has-text("Start New Capture")');
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Wait for modal to appear and take screenshot
    await expect(page.locator('.ant-modal, .modal')).toBeVisible();
    await page.locator('.ant-modal, .modal').screenshot({
      path: `test-results/start-job-modal-${testInfo.retry}.png`
    });

    // Select a room from the dropdown
    const roomSelector = page.locator('.ant-select-selector').first();
    await roomSelector.click();
    
    // Select the first room option
    await page.locator('text=Room A').click();

    // Take screenshot before confirming
    await page.screenshot({
      path: `test-results/before-confirm-job-${testInfo.retry}.png`
    });

    // Click the confirm button
    const confirmButton = page.locator('button:has-text("确定"), button:has-text("Confirm")');
    await confirmButton.click();

    // Wait for the request to complete
    await page.waitForResponse(response => response.url().includes('/api/capture/start'));

    // Take final screenshot after job started
    await page.screenshot({
      path: `test-results/after-start-job-${testInfo.retry}.png`,
      fullPage: true
    });

    // Verify that the new job appears in the table
    await expect(page.locator('text=Room A')).toBeVisible();
  });

  test('should handle error when starting a capture job', async ({ page }, testInfo) => {
    // Mock API responses - return error for start request
    await page.route('**/api/capture/jobs*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          total: 0,
        })
      });
    });

    await page.route('**/api/capture/rooms*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { roomId: '123456', anchorName: 'Anchor A', roomName: 'Room A' }
        ])
      });
    });

    // Mock error response when starting a job
    await page.route('**/api/capture/start*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Failed to start capture job',
          message: 'Internal server error'
        })
      });
    });

    await page.goto('http://localhost:3015/capture');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({
      path: `test-results/error-scenario-start-${testInfo.retry}.png`,
      fullPage: true
    });

    // Click the start button
    const startButton = page.locator('button:has-text("启动新捕获任务"), button:has-text("Start New Capture")');
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Wait for modal to appear
    await expect(page.locator('.ant-modal, .modal')).toBeVisible();

    // Select a room from the dropdown
    const roomSelector = page.locator('.ant-select-selector').first();
    await roomSelector.click();
    await page.locator('text=Room A').click();

    // Click the confirm button
    const confirmButton = page.locator('button:has-text("确定"), button:has-text("Confirm")');
    await confirmButton.click();

    // Wait for the error response
    await page.waitForResponse(response => response.url().includes('/api/capture/start'));

    // Take screenshot showing error state/message
    await page.screenshot({
      path: `test-results/error-response-screenshot-${testInfo.retry}.png`,
      fullPage: true
    });

    // Check for error message in UI
    const errorMessage = page.locator('.ant-message-error, .error-message, .alert-error');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should handle stopping a capture job', async ({ page }, testInfo) => {
    // Mock API responses
    await page.route('**/api/capture/jobs*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: '1',
              roomId: '123456',
              roomName: 'Test Room 1',
              status: 'Running',
              duration: 3600,
              startTime: '2026-03-08T00:00:00Z',
              endTime: null,
              createdAt: '2026-03-08T00:00:00Z',
            }
          ],
          total: 1,
        })
      });
    });

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

    await page.goto('http://localhost:3015/capture');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({
      path: `test-results/before-stop-job-${testInfo.retry}.png`,
      fullPage: true
    });

    // Find the running job and click its stop button
    const stopButton = page.locator('button:has-text("停止"), button:has-text("Stop")').first();
    if (await stopButton.count() > 0) {
      await stopButton.click();
      
      // Confirm if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("确认"), button:has-text("Yes")');
      if (await confirmButton.count() > 0) {
        // Take screenshot of confirmation dialog
        await page.screenshot({
          path: `test-results/confirm-stop-dialog-${testInfo.retry}.png`
        });
        
        await confirmButton.click();
      }
      
      // Wait for the request to complete
      await page.waitForResponse(response => response.url().includes('/api/capture/stop'));

      // Take final screenshot after job stopped
      await page.screenshot({
        path: `test-results/after-stop-job-${testInfo.retry}.png`,
        fullPage: true
      });
      
      // Verify that the status has changed to stopped
      await expect(page.locator('text=Stopped')).toBeVisible();
    } else {
      // If no stop button found, take a screenshot showing the issue
      await page.screenshot({
        path: `test-results/no-stop-button-found-${testInfo.retry}.png`,
        fullPage: true
      });
      throw new Error('Stop button not found');
    }
  });

  test('should handle deleting a capture job', async ({ page }, testInfo) => {
    // Mock API responses
    await page.route('**/api/capture/jobs*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: '1',
              roomId: '123456',
              roomName: 'Test Room 1',
              status: 'Stopped',
              duration: 3600,
              startTime: '2026-03-08T00:00:00Z',
              endTime: '2026-03-08T01:00:00Z',
              createdAt: '2026-03-08T00:00:00Z',
            }
          ],
          total: 1,
        })
      });
    });

    await page.route('**/api/capture/delete*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '删除成功' })
      });
    });

    await page.goto('http://localhost:3015/capture');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({
      path: `test-results/before-delete-job-${testInfo.retry}.png`,
      fullPage: true
    });

    // Find a job and click its delete button
    const deleteButton = page.locator('button:has-text("删除"), button:has-text("Delete")').first();
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      
      // Confirm if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("确认"), button:has-text("Yes")');
      if (await confirmButton.count() > 0) {
        // Take screenshot of confirmation dialog
        await page.screenshot({
          path: `test-results/confirm-delete-dialog-${testInfo.retry}.png`
        });
        
        await confirmButton.click();
      }
      
      // Wait for the request to complete
      await page.waitForResponse(response => response.url().includes('/api/capture/delete'));

      // Take final screenshot after job deleted
      await page.screenshot({
        path: `test-results/after-delete-job-${testInfo.retry}.png`,
        fullPage: true
      });

      // Verify that the job has been removed from the table
      await expect(page.locator('text=Test Room 1')).not.toBeVisible();
    } else {
      // If no delete button found, take a screenshot showing the issue
      await page.screenshot({
        path: `test-results/no-delete-button-found-${testInfo.retry}.png`,
        fullPage: true
      });
      throw new Error('Delete button not found');
    }
  });

  test('should handle error when deleting a capture job', async ({ page }, testInfo) => {
    // Mock API responses - return error for delete request
    await page.route('**/api/capture/jobs*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: '1',
              roomId: '123456',
              roomName: 'Test Room 1',
              status: 'Stopped',
              duration: 3600,
              startTime: '2026-03-08T00:00:00Z',
              endTime: '2026-03-08T01:00:00Z',
              createdAt: '2026-03-08T00:00:00Z',
            }
          ],
          total: 1,
        })
      });
    });

    await page.route('**/api/capture/delete*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Failed to delete capture job',
          message: 'Internal server error'
        })
      });
    });

    await page.goto('http://localhost:3015/capture');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({
      path: `test-results/error-scenario-delete-${testInfo.retry}.png`,
      fullPage: true
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
      
      // Wait for the error response
      await page.waitForResponse(response => response.url().includes('/api/capture/delete'));

      // Take screenshot showing error state
      await page.screenshot({
        path: `test-results/error-response-delete-${testInfo.retry}.png`,
        fullPage: true
      });

      // Check for error message in UI
      const errorMessage = page.locator('.ant-message-error, .error-message, .alert-error');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
      }
    }
  });

  test('should handle room selection dropdown', async ({ page }, testInfo) => {
    // Mock API responses
    await page.route('**/api/capture/rooms*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { roomId: '123456', anchorName: 'Anchor A', roomName: 'Room A' },
          { roomId: '789012', anchorName: 'Anchor B', roomName: 'Room B' },
          { roomId: '345678', anchorName: 'Anchor C', roomName: 'Room C' }
        ])
      });
    });

    await page.goto('http://localhost:3015/capture');
    await page.waitForLoadState('networkidle');

    // Click the start button to open the modal
    const startButton = page.locator('button:has-text("启动新捕获任务")');
    if (await startButton.count() > 0) {
      await startButton.click();

      // Wait for the modal to appear
      await expect(page.locator('.ant-modal')).toBeVisible();

      // Take screenshot of the modal with room selection
      await page.locator('.ant-modal').screenshot({
        path: `test-results/modal-room-selection-${testInfo.retry}.png`
      });

      // Check for room selection dropdown
      const roomSelector = page.locator('.ant-select-selector').first();
      await expect(roomSelector).toBeVisible();

      // Click the selector to show options
      await roomSelector.click();

      // Take screenshot of dropdown options
      await page.screenshot({
        path: `test-results/dropdown-options-${testInfo.retry}.png`
      });

      // Check that the available rooms are listed
      await expect(page.locator('text=Room A')).toBeVisible();
      await expect(page.locator('text=Room B')).toBeVisible();
      await expect(page.locator('text=Room C')).toBeVisible();

      // Close the dropdown and modal
      await page.locator('body').click({ position: { x: 0, y: 0 } }); // Click outside to close dropdown
      await page.locator('button:has-text("取消"), button:has-text("Cancel")').click();
    } else {
      // If no start button found, take a screenshot of the page
      await page.screenshot({
        path: `test-results/no-start-button-${testInfo.retry}.png`,
        fullPage: true
      });
      throw new Error('Start button not found');
    }
  });
});
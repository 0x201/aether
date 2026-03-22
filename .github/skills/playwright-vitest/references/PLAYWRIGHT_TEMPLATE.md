# Playwright Template & Best Practices

- Prefer role-based locators: `page.getByRole('button', { name: /submit/i })`.
- Use web-first assertions: `await expect(locator).toHaveText()`.
- Keep tests deterministic and small; avoid long hard-coded waits.

Example E2E test (TypeScript):

```ts
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: /email/i }).fill('user@example.com');
  await page.getByRole('textbox', { name: /password/i }).fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/);
});
```

Notes:
- Use `test.step()` to break long flows into named steps for clearer reporting.
- Use fixtures for auth state to avoid repeating login flows.

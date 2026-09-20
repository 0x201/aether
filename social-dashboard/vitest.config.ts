import { fileURLToPath } from "node:url"

import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    browser: {
      provider: playwright(),
      enabled: true,
      instances: [{ browser: "chromium" }],
    },
    globals: true,
    projects: [
      {
        test: {
          name: "unit",
          include: ["./test/unit/*.{test,spec}.{ts,tsx}"],
        },
      },
      {
        test: {
          name: "e2e",
          include: ["./test/e2e/*.{test,spec}.{ts,tsx}"],
        },
      },
    ],
  },
})

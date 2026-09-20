import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: "./",
    environment: "node",
    include: ["**/*.e2e-spec.ts"],
    setupFiles: ["./test/vitest.setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})

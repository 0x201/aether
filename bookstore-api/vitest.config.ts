import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.{js,ts}"],
    exclude: ["node_modules", "dist", "coverage"],
    setupFiles: ["./test/vitest.setup.ts"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      exclude: [
        "test/**",
        "dist/**",
        "**/node_modules/**",
        "**/interface/**",
        "**/entities/**",
        "**/dtos/**",
        "**/commands/**",
        "**/queries/**",
        "**/role.enum.ts",
        "**/jwt-payload.interface.ts",
        "**/configuration.ts",
        "**/config.interface.ts",
        "**/IPagedResult.interface.ts",
        "**/BaseAuditableEntity.entity.ts",
        "**/main.ts",
        "**/app.module.ts",
        "**/database.module.ts",
        "**/cache.module.ts",
        "**/shared.module.ts",
        "**/keycloak.config.ts",
        "**/typeorm-migration.config.ts",
        "**/*.module.ts",
        "**/migrations/**",
        "**/common/services/generic-crud-base.service.ts",
        "**/common/services/generic-crud-auditable.service.ts",
        "**/Result.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
});

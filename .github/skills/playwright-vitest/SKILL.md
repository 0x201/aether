---
name: playwright-vitest
description: >-
  Generate Playwright E2E and Vitest unit/component tests for React projects.
  Use when asked to scaffold tests, produce example tests, create test-run
  scripts, or generate patchable test files for React apps using Playwright
  (E2E) and Vitest (unit). Triggers when the user requests automated test
  generation, Playwright tests, Vitest tests, or CI templates for Playwright/Vitest.
---

# Playwright + Vitest Skill

Overview

- Purpose: scaffold TypeScript Playwright E2E tests and Vitest unit/component
  tests, produce example files, and provide a small CLI script to generate
  test skeletons under a central `tests/` directory.

When to use

- Use this skill when asked to: "generate tests", "scaffold Playwright tests",
  "create Vitest unit tests", or "add CI for Playwright and Vitest".

Core workflow

1. Identify project root (nearest `package.json`).
2. Create `tests/e2e` and `tests/unit` directories under the project root.
3. Write TypeScript example tests and helper fixtures (Playwright + Vitest).
4. Optionally create a branch/patch with the changes (ask user before pushing).

Included resources

- `scripts/generate_tests.js`: Node script to scaffold tests and write example
  test files. Use to automate test generation.
- `references/PLAYWRIGHT_TEMPLATE.md`: Playwright example and best-practices.
- `references/VITEST_TEMPLATE.md`: Vitest unit test templates (vitest-only by
  default; `@testing-library/react` optional for component rendering).

Usage (human)

- Run from project root with Node:

  node .github/skills/playwright-vitest/scripts/generate_tests.js --root . --type all

Options

- `--root <path>`: project root containing `package.json` (default: current
  working directory).
- `--type <e2e|unit|all>`: which tests to generate (default: `all`).
- `--open-pr`: if provided, the script will prepare a branch and show git
  commands to create a PR (does not push or create PR automatically).

Design notes for Codex

- Keep generated tests TypeScript by default and place them under `tests/`.
- Prefer role-based locators and Playwright web-first assertions. Use
  descriptive test titles and small focused tests.

References and templates

- See `references/PLAYWRIGHT_TEMPLATE.md` and
  `references/VITEST_TEMPLATE.md` for copyable test snippets and best
  practices.

# Vitest + React Testing Library Template

Use `vitest` for unit tests by default. Do not require `@testing-library/react`
unless you specifically need DOM/component rendering in a test.

Example unit test (TypeScript):

```ts
import { describe, it, expect } from 'vitest';

// Replace with actual module imports
// import { add } from '../../src/utils/math';

describe('math utils', () => {
  it('adds numbers', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Notes:
- Use pure `vitest` assertions for logic and utility tests.
- Add `@testing-library/react` only when tests need to render React components.
- Keep unit tests focused on a single behavior.

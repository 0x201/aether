import { Mocked, vi } from 'vitest'

export function createMock<T>(obj: T): Mocked<T> {
  const mock: any = {}

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'function') {
      mock[key] = vi.fn()
    } else {
      mock[key] = obj[key]
    }
  }

  return mock as Mocked<T>
}

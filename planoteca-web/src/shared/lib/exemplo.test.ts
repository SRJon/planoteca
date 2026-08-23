import { describe, expect, it } from 'vitest'

describe('ambiente', () => {
  it('roda com jsdom', () => {
    expect(typeof document).toBe('object')
  })
})

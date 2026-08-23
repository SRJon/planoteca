import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('junta apenas os valores verdadeiros, na ordem recebida', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })

  it('devolve string vazia quando nada sobra', () => {
    expect(cn(false, null, undefined)).toBe('')
  })
})

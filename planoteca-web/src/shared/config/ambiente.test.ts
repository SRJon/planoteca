import { describe, expect, it } from 'vitest'
import { lerAmbiente } from './ambiente'

describe('lerAmbiente', () => {
  it('lê a url da api', () => {
    const a = lerAmbiente({ VITE_URL_API: 'https://localhost:7206', MODE: 'development' })
    expect(a.urlApi).toBe('https://localhost:7206')
    expect(a.modo).toBe('dev')
  })

  it('recusa url ausente', () => {
    expect(() => lerAmbiente({ MODE: 'development' })).toThrow(/VITE_URL_API/)
  })

  it('recusa url com barra final', () => {
    expect(() => lerAmbiente({ VITE_URL_API: 'https://x/', MODE: 'development' }))
      .toThrow(/barra/)
  })
})

import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { criarCliente } from '@/shared/api'
import { COMPONENTES_FIXTURE, SERIES_FIXTURE } from '@/teste/planos'
import { obterFacetas } from './api'
import { useFacetas } from './useFacetas'

const BASE = 'https://api.teste'

const cliente = criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })

function envolver({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('facetas', () => {
  it('não manda paginação na querystring', async () => {
    let urlChamada = ''
    const espiao = criarCliente({
      urlBase: BASE,
      lerToken: () => null,
      aoExpirar: () => {},
    })
    const original = espiao.obter
    // Envolve `obter` só para ler o caminho: a asserção é sobre o que o
    // cliente monta, e não sobre o que a simulação devolve.
    espiao.obter = ((caminho: string, parametros?: Record<string, unknown>) => {
      urlChamada = `${caminho}?${new URLSearchParams(
        Object.entries(parametros ?? {})
          .filter(([, v]) => v !== undefined)
          .map(([c, v]) => [c, String(v)]),
      ).toString()}`
      return original.call(espiao, caminho, parametros as never)
    }) as typeof espiao.obter

    await obterFacetas(espiao, { busca: 'juros', pagina: 3, tamanhoPagina: 12 })

    expect(urlChamada).toContain('/lesson-plans/facets')
    expect(urlChamada).toContain('q=juros')
    expect(urlChamada).not.toContain('page=')
    expect(urlChamada).not.toContain('perPage=')
  })

  it('a contagem do próprio grupo ignora a seleção dele, e a dos outros a aplica', async () => {
    const matematica = COMPONENTES_FIXTURE[0]!
    const historia = COMPONENTES_FIXTURE[3]!
    const setimo = SERIES_FIXTURE[1]!

    const { result } = renderHook(
      () => useFacetas(cliente, { componentesIds: [matematica.id] }),
      { wrapper: envolver },
    )

    await waitFor(() => expect(result.current.data).toBeDefined())
    const facetas = result.current.data!

    // RF-02: o grupo componente ignora a própria marca. História continua
    // com os planos de História, e não com zero.
    const deHistoria = facetas.componentes.find((c) => c.id === historia.id)
    expect(deHistoria?.total).toBeGreaterThan(0)

    // Já a série aplica o recorte do OUTRO grupo: o 7º só conta o que também
    // é Matemática. Na fixture os índices ciclam 5 componentes sobre 5
    // séries, e Matemática nunca cai no 7º ano.
    const doSetimo = facetas.series.find((s) => s.id === setimo.id)
    expect(doSetimo?.total ?? 0).toBe(0)
  })

  it('mantém a contagem anterior enquanto a busca nova está em voo', async () => {
    const { result, rerender } = renderHook(
      ({ ids }: { ids: string[] }) => useFacetas(cliente, { componentesIds: ids }),
      { wrapper: envolver, initialProps: { ids: [] as string[] } },
    )

    await waitFor(() => expect(result.current.data).toBeDefined())
    const antes = result.current.data!

    rerender({ ids: [COMPONENTES_FIXTURE[0]!.id] })

    // `keepPreviousData`: sem isto a coluna inteira perderia os números a
    // cada marca, e cada toque pareceria uma tela recarregando.
    expect(result.current.data).toBe(antes)
  })
})

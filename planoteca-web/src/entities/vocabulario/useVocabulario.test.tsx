import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { criarCliente } from '@/shared/api'
import { CHAVE_VOCABULARIO, CHAVE_VOCABULARIO_ADMIN, useSalvarComponente } from './useVocabulario'

const BASE = 'https://api.teste'

/**
 * Prova RF-08: cadastrar pela tela invalida `CHAVE_VOCABULARIO`, para a
 * Biblioteca (que consome `useVocabulario`) atualizar sem recarregar a
 * página. `useSalvarComponente` também invalida `CHAVE_VOCABULARIO_ADMIN`
 * (a própria tela de gestão), mas esta é a invalidação que RF-08 nomeia.
 */
describe('useSalvarComponente', () => {
  it('invalida o vocabulário depois de salvar um componente', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    const cliente = criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })

    const { result } = renderHook(() => useSalvarComponente(cliente), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    await act(async () => {
      await result.current.mutateAsync({
        nome: 'Filosofia',
        area: 'Ciências Humanas',
        sigla: 'FI',
        cor: 'comp-humanas',
        ordem: 1,
        ativo: true,
      })
    })

    expect(invalidar).toHaveBeenCalledWith({ queryKey: CHAVE_VOCABULARIO })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: CHAVE_VOCABULARIO_ADMIN })
  })
})

/**
 * As duas chaves precisam ser IRMÃS, e não parente uma da outra.
 *
 * `invalidateQueries` casa por PREFIXO. Enquanto a chave administrativa foi
 * `['vocabulario', 'admin']`, invalidar a pública levava a administrativa
 * junto — as duas linhas da mutação viravam uma só, e a intenção de invalidar
 * cada uma deixava de valer sem nenhum sintoma. Este teste é o que impede a
 * chave voltar a nascer com o prefixo da outra.
 */
describe('as chaves de vocabulário', () => {
  it('não têm uma como prefixo da outra', () => {
    const publica: readonly string[] = CHAVE_VOCABULARIO
    const admin: readonly string[] = CHAVE_VOCABULARIO_ADMIN
    const menor = publica.length <= admin.length ? publica : admin
    const maior = publica.length <= admin.length ? admin : publica

    expect(maior.slice(0, menor.length)).not.toEqual(menor)
  })
})

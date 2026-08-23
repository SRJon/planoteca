import { act, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { useFiltroPlanos } from './useFiltroPlanos'

function montar(url = '/biblioteca') {
  return renderHook(() => useFiltroPlanos(), {
    wrapper: ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>,
  })
}

/**
 * O mecanismo de multisseleção da Biblioteca, isolado da tela: alternar um
 * id na lista de um grupo, ler a URL de volta com `getAll`, e a distinção
 * entre "sem filtro" (lista vazia) e "filtro que não casa nada".
 *
 * `PaginaBiblioteca.test.tsx` cobre o mesmo mecanismo por cima, contra a API
 * simulada — este arquivo prova o hook sozinho, sem depender de rede.
 */
describe('useFiltroPlanos — multisseleção', () => {
  it('clicar num chip inativo ACRESCENTA o id à lista do grupo', () => {
    const { result } = montar()

    act(() => result.current.alternarSerie('serie-a'))
    expect(result.current.seriesIds).toEqual(['serie-a'])

    act(() => result.current.alternarSerie('serie-b'))
    // As duas convivem: a segunda soma, não substitui a primeira.
    expect(result.current.seriesIds).toEqual(['serie-a', 'serie-b'])
  })

  it('clicar num chip já ativo o REMOVE sem derrubar os outros selecionados', () => {
    const { result } = montar('/biblioteca?serie=serie-a&serie=serie-b&serie=serie-c')

    act(() => result.current.alternarSerie('serie-b'))

    expect(result.current.seriesIds).toEqual(['serie-a', 'serie-c'])
  })

  it('URL com a chave repetida é lida de volta com getAll, íntegra', () => {
    const { result } = montar('/biblioteca?componente=c1&componente=c2&serie=s1')

    expect(result.current.componentesIds).toEqual(['c1', 'c2'])
    expect(result.current.seriesIds).toEqual(['s1'])
    expect(result.current.metodologiasIds).toEqual([])
  })

  it('lista vazia é "sem filtro": o filtro emitido para a API não traz o grupo', () => {
    const { result } = montar()

    expect(result.current.filtro.componentesIds).toEqual([])
    expect(result.current.filtro.seriesIds).toEqual([])
    expect(result.current.temFiltro).toBe(false)
  })

  it('alternar um grupo reinicia a página, mas preserva os outros grupos', () => {
    const { result } = montar('/biblioteca?serie=serie-a&componente=comp-x&pagina=3')

    act(() => result.current.alternarSerie('serie-b'))

    expect(result.current.seriesIds).toEqual(['serie-a', 'serie-b'])
    // O componente selecionado antes não é afetado por alternar série.
    expect(result.current.componentesIds).toEqual(['comp-x'])
    expect(result.current.pagina).toBe(1)
  })
})

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { FiltroPlano } from '@/entities/plano'

/** Quantos planos por página. Casa com o padrão do back-end. */
export const TAMANHO_PAGINA = 12

/**
 * O filtro da Biblioteca, inteiro na URL.
 *
 * Isso não é detalhe técnico: "manda o link desse filtro" é como um
 * professor passa uma seleção para outro. Estado em `useState` não
 * sobreviveria a um recarregamento nem a um link colado no grupo da escola.
 *
 * ── O que mudou com o vocabulário dinâmico ───────────────────────────────
 *
 * Antes a querystring carregava o SLUG do domínio (`componente=matematica`),
 * traduzido para o fio por um mapa em `entities/plano/mapeador.ts`. Agora
 * carrega o GUID do vocabulário, que vem do banco.
 *
 * A troca custou legibilidade — `?componente=8f3a...` diz menos a um humano
 * que `?componente=matematica`. Em compensação, o filtro não depende de uma
 * lista fechada mantida em dois lugares: cadastrar Filosofia no painel passa
 * a funcionar sem deploy. Um link antigo com slug simplesmente não casa com
 * nenhum GUID e devolve a lista sem recorte, que é degradação aceitável para
 * uma base ainda não publicada.
 */
export function useFiltroPlanos() {
  const [parametros, definirParametros] = useSearchParams()

  const busca = parametros.get('q') ?? ''
  const componenteId = parametros.get('componente')
  const serieId = parametros.get('serie')
  const metodologiaId = parametros.get('metodologia')
  const paginaCrua = Number(parametros.get('pagina') ?? '1')
  const pagina = Number.isFinite(paginaCrua) && paginaCrua > 0 ? Math.trunc(paginaCrua) : 1

  /**
   * Escreve na URL. `null` REMOVE o parâmetro em vez de gravar a string
   * "null" — a querystring é a fonte da verdade, e um `componente=null`
   * viajaria para a API como recorte válido.
   *
   * Toda alteração de recorte volta para a página 1: manter a página 5 ao
   * trocar de componente mostraria uma lista vazia com botão de "anterior"
   * ativo, e quem filtrou pensaria que não há planos.
   */
  const definir = useCallback(
    (mudancas: Record<string, string | null>, reiniciarPagina = true) => {
      definirParametros(
        (atual) => {
          const proximo = new URLSearchParams(atual)
          for (const [chave, valor] of Object.entries(mudancas)) {
            if (valor === null || valor === '') proximo.delete(chave)
            else proximo.set(chave, valor)
          }
          if (reiniciarPagina) proximo.delete('pagina')
          return proximo
        },
        { replace: true },
      )
    },
    [definirParametros],
  )

  const definirBusca = useCallback((valor: string) => definir({ q: valor || null }), [definir])

  /** Clicar no chip já ativo o DESLIGA. É o gesto que a tela ensina: o chip
   * é um interruptor, não um item de lista de seleção única. */
  const alternarComponente = useCallback(
    (id: string) => definir({ componente: componenteId === id ? null : id }),
    [definir, componenteId],
  )

  const alternarSerie = useCallback(
    (id: string) => definir({ serie: serieId === id ? null : id }),
    [definir, serieId],
  )

  const alternarMetodologia = useCallback(
    (id: string) => definir({ metodologia: metodologiaId === id ? null : id }),
    [definir, metodologiaId],
  )

  const irParaPagina = useCallback(
    (numero: number) => definir({ pagina: numero <= 1 ? null : String(numero) }, false),
    [definir],
  )

  const limpar = useCallback(
    () => definirParametros(new URLSearchParams(), { replace: true }),
    [definirParametros],
  )

  const temFiltro = Boolean(busca || componenteId || serieId || metodologiaId)

  /** O que vai para a API. Memoizado porque é chave de cache do TanStack
   * Query: um objeto novo a cada render refaria a busca sem parar. */
  const filtro: FiltroPlano = useMemo(
    () => ({
      // `busca` entra só quando tem valor, e não como `undefined`: o
      // `exactOptionalPropertyTypes` do projeto distingue "chave ausente" de
      // "chave com undefined", e a segunda não satisfaz um campo opcional.
      ...(busca ? { busca } : {}),
      componenteId,
      serieId,
      metodologiaId,
      pagina,
      tamanhoPagina: TAMANHO_PAGINA,
    }),
    [busca, componenteId, serieId, metodologiaId, pagina],
  )

  return {
    busca,
    componenteId,
    serieId,
    metodologiaId,
    pagina,
    filtro,
    temFiltro,
    definirBusca,
    alternarComponente,
    alternarSerie,
    alternarMetodologia,
    irParaPagina,
    limpar,
  }
}

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
 *
 * ── Multisseleção ─────────────────────────────────────────────────────────
 *
 * Cada grupo (série, componente, metodologia) aceita mais de um id: a chave
 * repete na URL (`?serie=a&serie=b`), lida de volta com `getAll`. Dentro de
 * um grupo, a semântica é OU — o mesmo contrato do back-end
 * (`FiltroPlano.SeriesIds` em `IPlanoRepository.cs`).
 */
export function useFiltroPlanos() {
  const [parametros, definirParametros] = useSearchParams()

  const busca = parametros.get('q') ?? ''
  const componentesIds = parametros.getAll('componente')
  const seriesIds = parametros.getAll('serie')
  const metodologiasIds = parametros.getAll('metodologia')
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

  /**
   * Alterna a presença de um id na lista de um grupo, preservando os demais
   * — é o mecanismo comum aos três grupos. Clicar num chip já ativo o
   * REMOVE da lista sem derrubar os outros ids selecionados; clicar num
   * chip inativo ACRESCENTA (`append`), não substitui (`set`).
   */
  const alternarNaChave = useCallback(
    (chave: string, id: string) => {
      definirParametros(
        (atual) => {
          const proximo = new URLSearchParams(atual)
          const selecionados = proximo.getAll(chave)
          proximo.delete(chave)
          const restantes = selecionados.includes(id)
            ? selecionados.filter((v) => v !== id)
            : [...selecionados, id]
          for (const valor of restantes) proximo.append(chave, valor)
          proximo.delete('pagina')
          return proximo
        },
        { replace: true },
      )
    },
    [definirParametros],
  )

  const alternarComponente = useCallback(
    (id: string) => alternarNaChave('componente', id),
    [alternarNaChave],
  )

  const alternarSerie = useCallback(
    (id: string) => alternarNaChave('serie', id),
    [alternarNaChave],
  )

  const alternarMetodologia = useCallback(
    (id: string) => alternarNaChave('metodologia', id),
    [alternarNaChave],
  )

  const irParaPagina = useCallback(
    (numero: number) => definir({ pagina: numero <= 1 ? null : String(numero) }, false),
    [definir],
  )

  const limpar = useCallback(
    () => definirParametros(new URLSearchParams(), { replace: true }),
    [definirParametros],
  )

  const temFiltro = Boolean(
    busca || componentesIds.length || seriesIds.length || metodologiasIds.length,
  )

  // Chave estável dos três grupos: `getAll` devolve um array NOVO a cada
  // render, então comparar por identidade recriaria `filtro` sempre — e
  // `filtro` é chave de cache do TanStack Query, então isso refaria a busca
  // sem parar. `.join()` reduz a uma string, que o `useMemo` compara por
  // valor.
  const chaveComponentes = componentesIds.join(',')
  const chaveSeries = seriesIds.join(',')
  const chaveMetodologias = metodologiasIds.join(',')

  /** O que vai para a API. Memoizado pelo mesmo motivo acima. */
  const filtro: FiltroPlano = useMemo(
    () => ({
      // `busca` entra só quando tem valor, e não como `undefined`: o
      // `exactOptionalPropertyTypes` do projeto distingue "chave ausente" de
      // "chave com undefined", e a segunda não satisfaz um campo opcional.
      ...(busca ? { busca } : {}),
      componentesIds,
      seriesIds,
      metodologiasIds,
      pagina,
      tamanhoPagina: TAMANHO_PAGINA,
    }),
    [busca, chaveComponentes, chaveSeries, chaveMetodologias, pagina], // eslint-disable-line react-hooks/exhaustive-deps -- as chaves acima são o valor estável dos arrays na linha de cima
  )

  return {
    busca,
    componentesIds,
    seriesIds,
    metodologiasIds,
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

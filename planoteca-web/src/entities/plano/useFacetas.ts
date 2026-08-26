import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Cliente } from '@/shared/api'
import { obterFacetas } from './api'
import type { FiltroPlano } from './api'

/**
 * As contagens da coluna de filtro, em cache.
 *
 * A chave é `['facetas', filtro-sem-paginação]`, IRMÃ de `['planos', filtro]`
 * e não filha: as duas consultas respondem perguntas diferentes sobre o mesmo
 * recorte, e `invalidateQueries` casa por prefixo — uma chave filha
 * invalidaria a outra em silêncio (`Docs/lessons.md`, 2026-08-23).
 *
 * `placeholderData: keepPreviousData` pelo mesmo motivo de `usePlanos`: sem
 * ele, marcar um componente apagaria TODOS os números da coluna até a
 * resposta nova chegar. Numa tela cujo modo de uso é ligar e desligar item,
 * isso transformaria cada refinamento numa tela recarregando.
 */
export function useFacetas(cliente: Cliente, filtro?: FiltroPlano) {
  // Mesma remoção de `obterFacetas`, e pela mesma razão de lint. A chave
  // precisa ser o filtro SEM paginação: com ela, virar a página trocaria a
  // chave e a coluna refaria a busca sem nenhum número ter mudado (RF-04).
  const semPaginacao: FiltroPlano = { ...filtro }
  delete semPaginacao.pagina
  delete semPaginacao.tamanhoPagina
  return useQuery({
    queryKey: ['facetas', semPaginacao],
    queryFn: () => obterFacetas(cliente, filtro),
    placeholderData: keepPreviousData,
  })
}

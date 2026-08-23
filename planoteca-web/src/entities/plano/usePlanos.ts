import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Cliente } from '@/shared/api'
import { buscarPlano, listarPlanos } from './api'
import type { FiltroPlano } from './api'

/**
 * Lista de planos via TanStack Query. Chave `['planos', filtro]` — muda o
 * filtro, muda o cache.
 *
 * `placeholderData: keepPreviousData`: sem isto, mexer num chip de ano ou
 * de componente jogaria `data` para `undefined` até a resposta nova chegar,
 * e a lista inteira piscaria a cada toque. Numa tela cujo modo de uso É
 * ligar e desligar filtro, isso não é detalhe — é a diferença entre
 * refinar uma busca e recomeçar uma. Mesmo padrão de `entities/pessoa`.
 */
export function usePlanos(cliente: Cliente, filtro?: FiltroPlano) {
  return useQuery({
    queryKey: ['planos', filtro],
    queryFn: () => listarPlanos(cliente, filtro),
    placeholderData: keepPreviousData,
  })
}

/**
 * A ficha de um plano.
 *
 * `enabled` guarda contra `id` vazio: a rota de detalhe monta antes de o
 * parâmetro existir em alguns caminhos de navegação, e sem isto a primeira
 * requisição sairia para `/lesson-plans/undefined`.
 */
export function usePlano(cliente: Cliente, id: string | undefined) {
  return useQuery({
    queryKey: ['plano', id],
    queryFn: () => buscarPlano(cliente, id!),
    enabled: Boolean(id),
  })
}

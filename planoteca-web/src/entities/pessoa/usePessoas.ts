import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Cliente } from '@/shared/api'
import { listarPessoas } from './api'
import type { FiltroPessoa } from './api'

/**
 * Lista de pessoas via TanStack Query. Chave `['pessoas', filtro]` — muda
 * o filtro, muda o cache.
 *
 * `placeholderData: keepPreviousData`: sem isto, trocar de página, tamanho,
 * ordenação ou filtro joga `data` para `undefined` até a resposta nova
 * chegar, e quem consome reagiria desmontando a tabela para mostrar um
 * estado de carregamento — cada interação piscaria a tela inteira em vez de
 * só atualizar as linhas. Mesmo padrão de `entities/projeto`.
 */
export function usePessoas(cliente: Cliente, filtro?: FiltroPessoa) {
  return useQuery({
    queryKey: ['pessoas', filtro],
    queryFn: () => listarPessoas(cliente, filtro),
    placeholderData: keepPreviousData,
  })
}

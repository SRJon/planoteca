import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Cliente } from '@/shared/api'
import {
  arquivarPost,
  buscarPost,
  buscarPostAdmin,
  contarPendentes,
  desarquivarPost,
  escreverPost,
  listarPosts,
  listarPostsAdmin,
  moderarPost,
} from './api'
import type { FiltroPost } from './api'
import type { Moderacao, PostEntrada, SituacaoPost } from './modelo'

/** A raiz das chaves de cache do blog. Invalidar por ela derruba listagem,
 * fila e contagem de uma vez — o que é o certo depois de moderar. */
export const CHAVE_POSTS = ['posts'] as const

/** Os textos publicados. */
export function usePosts(cliente: Cliente, filtro?: FiltroPost) {
  return useQuery({
    queryKey: [...CHAVE_POSTS, 'publicos', filtro],
    queryFn: () => listarPosts(cliente, filtro),
    placeholderData: keepPreviousData,
  })
}

/** Um texto publicado. */
export function usePost(cliente: Cliente, id: string | undefined) {
  return useQuery({
    queryKey: [...CHAVE_POSTS, 'detalhe', id],
    queryFn: () => buscarPost(cliente, id!),
    enabled: Boolean(id),
  })
}

/** A fila de moderação, ou os textos de um autor. */
export function usePostsAdmin(
  cliente: Cliente,
  opcoes: { situacao?: SituacaoPost; autorId?: string; pagina?: number } = {},
) {
  return useQuery({
    queryKey: [...CHAVE_POSTS, 'admin', opcoes],
    queryFn: () => listarPostsAdmin(cliente, opcoes),
    placeholderData: keepPreviousData,
  })
}

/** Um texto em qualquer situação. */
export function usePostAdmin(cliente: Cliente, id: string | undefined) {
  return useQuery({
    queryKey: [...CHAVE_POSTS, 'admin-detalhe', id],
    queryFn: () => buscarPostAdmin(cliente, id!),
    enabled: Boolean(id),
  })
}

/**
 * Quantos textos aguardam moderação.
 *
 * `refetchInterval` de 2 minutos: o número muda quando OUTRA pessoa escreve,
 * e o administrador pode ficar com o painel aberto. Sem isso, o "0
 * pendentes" da manhã continuaria zero à tarde. Dois minutos é raro o
 * bastante para não incomodar o plano gratuito do Render, que hiberna.
 */
export function usePendentes(cliente: Cliente) {
  return useQuery({
    queryKey: [...CHAVE_POSTS, 'pendentes'],
    queryFn: () => contarPendentes(cliente),
    refetchInterval: 2 * 60 * 1000,
  })
}

/** Escreve um texto novo. */
export function useEscreverPost(cliente: Cliente, autorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entrada: PostEntrada) => escreverPost(cliente, entrada, autorId),
    // O texto novo entra na fila de moderação e na lista do autor. Invalidar
    // a raiz derruba as duas, mais a contagem de pendentes.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_POSTS }),
  })
}

/** Publica, devolve ou recusa. */
export function useModerarPost(cliente: Cliente, moderadorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decisao }: { id: string; decisao: Moderacao }) =>
      moderarPost(cliente, id, decisao, moderadorId),
    // Moderar altera a fila, a contagem E a listagem pública — publicar faz
    // o texto aparecer no blog. Por isso a invalidação é na raiz.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_POSTS }),
  })
}

/** Tira um texto do ar. Some da aba de origem e aparece em "Arquivados". */
export function useArquivarPost(cliente: Cliente) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => arquivarPost(cliente, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_POSTS }),
  })
}

/** Devolve um texto arquivado ao fluxo. */
export function useDesarquivarPost(cliente: Cliente) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => desarquivarPost(cliente, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_POSTS }),
  })
}

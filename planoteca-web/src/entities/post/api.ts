import { ErroApi } from '@/shared/api'
import type { Cliente, Pagina, Parametros } from '@/shared/api'
import type { Moderacao, Post, PostDetalhe, PostEntrada, SituacaoPost } from './modelo'

export type FiltroPost = {
  busca?: string
  pagina?: number
  tamanhoPagina?: number
}

function paraParametros(filtro: FiltroPost | undefined): Parametros | undefined {
  if (!filtro) return undefined
  return {
    q: filtro.busca || undefined,
    page: filtro.pagina,
    perPage: filtro.tamanhoPagina,
  }
}

/** Os textos publicados. Público, sem token. */
export async function listarPosts(
  cliente: Cliente,
  filtro?: FiltroPost,
): Promise<Pagina<Post>> {
  return cliente.listar<Post>('/posts', paraParametros(filtro))
}

/**
 * Um texto publicado. `null` quando não existe ou ainda não foi publicado.
 *
 * A API responde 404 nos dois casos, de propósito: um 403 diria "existe, mas
 * você não pode ver", e vazaria a existência de rascunho alheio.
 */
export async function buscarPost(cliente: Cliente, id: string): Promise<PostDetalhe | null> {
  try {
    return await cliente.obter<PostDetalhe>(`/posts/${id}`)
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 404) return null
    throw erro
  }
}

// ── Área de quem escreve e de quem modera ────────────────────────────────

/**
 * A fila de moderação, ou os textos de um autor.
 *
 * `autorId` é como o professor acompanha o que enviou, inclusive o que foi
 * devolvido — que ninguém mais vê.
 */
export async function listarPostsAdmin(
  cliente: Cliente,
  opcoes: { situacao?: SituacaoPost; autorId?: string; pagina?: number } = {},
): Promise<Pagina<Post>> {
  return cliente.listar<Post>('/admin/posts', {
    situacao: opcoes.situacao,
    autor: opcoes.autorId,
    page: opcoes.pagina,
  })
}

/** Quantos textos aguardam moderação. É o número que abre o painel. */
export async function contarPendentes(cliente: Cliente): Promise<number> {
  const resposta = await cliente.obter<{ total: number }>('/admin/posts/pendentes/contagem')
  return resposta?.total ?? 0
}

/** Um texto em qualquer situação — para moderar, é preciso ler. */
export async function buscarPostAdmin(
  cliente: Cliente,
  id: string,
): Promise<PostDetalhe | null> {
  try {
    return await cliente.obter<PostDetalhe>(`/admin/posts/${id}`)
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 404) return null
    throw erro
  }
}

/**
 * Escreve um texto. Nasce pendente, sempre.
 *
 * `autorId` viaja no CORPO enquanto não há login. É inseguro — qualquer um
 * poderia escrever em nome de qualquer pessoa — e sai assim que o token
 * existir, quando o autor passa a vir da claim.
 */
export async function escreverPost(
  cliente: Cliente,
  entrada: PostEntrada,
  autorId: string,
): Promise<{ id: string }> {
  const resposta = await cliente.enviar<{ id: string }>('/admin/posts', {
    ...entrada,
    autorId,
  })
  if (!resposta) throw new Error('A API não devolveu o texto criado.')
  return resposta
}

/** Publica, devolve ou recusa. Mesma ressalva de `escreverPost` sobre o id. */
export async function moderarPost(
  cliente: Cliente,
  id: string,
  decisao: Moderacao,
  moderadorId: string,
): Promise<void> {
  await cliente.enviar(`/admin/posts/${id}/moderacao`, { ...decisao, moderadorId })
}

/**
 * Domínio do texto do blog.
 *
 * O blog é a área colaborativa da Planoteca: relato de sala de aula escrito
 * por professor, para professor. Todo texto passa por moderação — quem
 * escreve não publica.
 */

/** Os cinco estados de um texto. */
export const SITUACOES_POST = ['pendente', 'publicado', 'devolvido', 'recusado', 'arquivado'] as const
export type SituacaoPost = (typeof SITUACOES_POST)[number]

/** O rótulo que a interface mostra, por situação. */
export const ROTULO_SITUACAO: Record<SituacaoPost, string> = {
  pendente: 'Aguardando aprovação',
  publicado: 'Publicado',
  devolvido: 'Devolvido para ajuste',
  recusado: 'Recusado',
  arquivado: 'Arquivado',
}

/**
 * A cor da etiqueta de situação.
 *
 * Mapa ESCRITO, e não classe interpolada: o Tailwind gera utilitário
 * varrendo o fonte por texto literal, e `bg-${situacao}` não existiria no CSS
 * final. Mesmo raciocínio de `classeCorComponente`.
 *
 * "Devolvido" usa o tom de aviso, e não o de erro: o texto não foi recusado,
 * ele volta para ajuste. A diferença importa para quem escreveu.
 */
export const CLASSE_SITUACAO: Record<SituacaoPost, string> = {
  pendente: 'bg-secondary text-foreground',
  publicado: 'bg-ok-bg text-ok',
  devolvido: 'bg-warn-bg text-warn',
  recusado: 'bg-err-bg text-err',
  // Neutro, como pendente: arquivado não é erro nem sucesso, é um texto
  // fora do fluxo por decisão de curadoria.
  arquivado: 'bg-secondary text-muted-foreground',
}

/** Um texto na listagem. */
export type Post = {
  id: string
  titulo: string
  resumo: string | null
  autorNome: string
  situacao: SituacaoPost
  publicadoEm: string | null
  criadoEm: string
  /**
   * Por que o texto foi devolvido ou recusado.
   *
   * Só chega ao próprio autor e ao administrador: a listagem pública devolve
   * apenas publicados, onde este campo é sempre nulo.
   */
  comentarioModeracao: string | null

  /** Quantas vezes a ficha foi lida. */
  visualizacoes: number
}

/** O texto completo. */
export type PostDetalhe = Post & {
  corpo: string
}

/** O que o professor escreve. */
export type PostEntrada = {
  titulo: string
  resumo?: string
  corpo: string
}

/** A decisão do administrador. */
export type Moderacao = {
  situacao: Exclude<SituacaoPost, 'pendente'>
  comentario?: string
}

/** As situações que exigem comentário — devolver ou recusar sem dizer o
 * motivo transforma moderação em silêncio. */
export const EXIGEM_COMENTARIO: SituacaoPost[] = ['devolvido', 'recusado']

/**
 * A data que a interface mostra.
 *
 * Publicado mostra a publicação; o resto mostra a criação. Um texto pendente
 * tem `publicadoEm` nulo, e mostrar "—" onde o leitor espera uma data parece
 * defeito.
 */
export function dataDoPost(post: Pick<Post, 'publicadoEm' | 'criadoEm'>): string {
  const iso = post.publicadoEm ?? post.criadoEm
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const PREFIXO_VISUALIZACAO = 'planoteca:post-visualizado:'
const JANELA_VISUALIZACAO_MS = 24 * 60 * 60 * 1000

/**
 * Se este navegador já contou uma leitura deste texto nas últimas 24h.
 *
 * Só a CHAVE do `localStorage` fica no navegador da pessoa — nenhum IP,
 * nenhum identificador viaja para o servidor. `try/catch` porque modo
 * anônimo lança ao acessar `localStorage`, e uma falha aqui não pode
 * impedir a leitura do texto: na dúvida (erro ao ler), NÃO conta de novo,
 * que é o lado seguro contra inflar o número.
 */
export function jaVisualizadoNesteNavegador(id: string): boolean {
  try {
    const registrado = window.localStorage.getItem(PREFIXO_VISUALIZACAO + id)
    if (!registrado) return false
    return Date.now() - Number(registrado) < JANELA_VISUALIZACAO_MS
  } catch {
    return true
  }
}

/** Marca este texto como lido neste navegador, agora. */
export function marcarVisualizadoNesteNavegador(id: string): void {
  try {
    window.localStorage.setItem(PREFIXO_VISUALIZACAO + id, String(Date.now()))
  } catch {
    // Modo anônimo, quota cheia, ou storage bloqueado: sem marca, a próxima
    // leitura conta de novo. É o efeito colateral aceitável — o alternativa
    // seria travar a leitura do texto por causa do contador, e o contador é
    // sempre secundário à leitura.
  }
}

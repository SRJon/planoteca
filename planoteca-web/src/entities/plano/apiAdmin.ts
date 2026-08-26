import type { Cliente, Pagina } from '@/shared/api'
import type { Plano } from './modelo'

/** O que a API devolve ao assinar o upload. */
export type UploadAssinado = {
  /** URL de uso único para o `PUT` do arquivo. */
  urlUpload: string
  /** Onde o arquivo responde depois de subir. É esta que vai em `arquivoUrl`. */
  urlPublica: string
  chave: string
  expiraEm: string
}

/** O que o formulário de catalogação envia. */
export type PlanoEntrada = {
  titulo: string
  autoria: string
  objetosConhecimento: string
  objetivo: string
  expectativasAprendizagem: string
  recursos?: string
  modalidade?: string
  turmaOrigem?: string
  duracaoAulas?: number
  duracaoDescricao?: string
  /** Opcional desde 2026-08-26: o validador da API não exige mais o anexo.
   * Ausente significa plano sem arquivo, e não erro de preenchimento. */
  arquivoUrl?: string
  componentePrincipalId: string
  componentesSecundariosIds: string[]
  seriesIds: string[]
  metodologiasIds: string[]
  etapas: { ordem: number; titulo: string | null; descricao: string }[]
  codigosBncc: string[]
  publicar: boolean
}

/**
 * Pede a URL assinada para subir o PDF.
 *
 * A API só ASSINA — o arquivo não passa por ela. O back-end roda no plano
 * gratuito do Render, com memória apertada e disco efêmero: um PDF de 100 MB
 * atravessando o processo consumiria a memória inteira, e gravá-lo em disco
 * seria inútil, porque o próximo deploy apaga.
 */
export async function assinarUpload(
  cliente: Cliente,
  nomeArquivo: string,
  tipoConteudo = 'application/pdf',
): Promise<UploadAssinado> {
  const resposta = await cliente.enviar<UploadAssinado>('/admin/lesson-plans/upload-url', {
    nomeArquivo,
    tipoConteudo,
  })
  if (!resposta) throw new Error('A API não devolveu a URL de upload.')
  return resposta
}

/**
 * Sobe o arquivo direto para o Cloudflare R2.
 *
 * Usa `fetch` cru, e NÃO o `Cliente` da aplicação: o destino é outro domínio,
 * e mandar para lá o cabeçalho `Authorization` da Planoteca vazaria o token
 * para um serviço que não precisa dele — e faria o R2 recusar, porque a
 * assinatura não o inclui.
 *
 * O `Content-Type` precisa ser EXATAMENTE o que foi assinado. O R2 recusa
 * qualquer outro, e é isso que impede a URL de virar um canal para subir
 * coisa arbitrária.
 */
export async function subirArquivo(
  urlUpload: string,
  arquivo: File,
  tipoConteudo = 'application/pdf',
): Promise<void> {
  const resposta = await fetch(urlUpload, {
    method: 'PUT',
    body: arquivo,
    headers: { 'Content-Type': tipoConteudo },
  })
  if (!resposta.ok) {
    throw new Error(`O envio do arquivo falhou (${resposta.status}). Tente de novo.`)
  }
}

/** Cataloga o plano. O arquivo já subiu quando esta chamada acontece. */
export async function catalogarPlano(
  cliente: Cliente,
  entrada: PlanoEntrada,
): Promise<{ id: string }> {
  const resposta = await cliente.enviar<{ id: string }>('/admin/lesson-plans', entrada)
  if (!resposta) throw new Error('A API não devolveu o plano criado.')
  return resposta
}

/**
 * Os planos do acervo, INCLUINDO rascunho.
 *
 * A diferença para `listarPlanos` é essa: aqui o administrador vê o que ainda
 * não publicou, que é o ponto da tela de gestão.
 */
export async function listarPlanosAdmin(
  cliente: Cliente,
  opcoes: { busca?: string; pagina?: number } = {},
): Promise<Pagina<Plano>> {
  return cliente.listar<Plano>('/admin/lesson-plans', {
    q: opcoes.busca || undefined,
    page: opcoes.pagina,
  })
}

/** Publica ou despublica. Despublicar não apaga: o plano volta a rascunho. */
export async function alterarSituacaoPlano(
  cliente: Cliente,
  id: string,
  publicar: boolean,
): Promise<void> {
  await cliente.enviar(`/admin/lesson-plans/${id}/situacao`, { publicar })
}

/** Remove um plano que nunca foi publicado. */
export async function removerPlano(cliente: Cliente, id: string): Promise<void> {
  await cliente.remover(`/admin/lesson-plans/${id}`)
}

export class ErroApi extends Error {
  readonly status: number
  readonly mensagens: string[]
  readonly campos: Record<string, string[]> | undefined

  constructor(status: number, mensagens: string[], campos?: Record<string, string[]>) {
    super(mensagens.join(' '))
    this.name = 'ErroApi'
    this.status = status
    this.mensagens = mensagens
    this.campos = campos
  }
}

/** Forma "validação de modelo" do ASP.NET (ValidationProblemDetails). Não está
 * declarada no contrato — o back-end normaliza tudo para `FormaNegocio` antes de
 * responder — mas é tratada aqui em defesa de mudanças futuras no back-end. */
type FormaValidacao = {
  errors?: Record<string, string[]>
}

/** Corpo `Error` do contrato: `{ messages: string[] | null, status: integer | string }`. */
type FormaNegocio = {
  messages?: string[] | null
}

/** Corpo `ProblemDetails` do contrato (padrão RFC 7807 do ASP.NET). */
type FormaProblema = {
  title?: string | null
  detail?: string | null
}

const POR_STATUS: Record<number, string> = {
  401: 'Sessão expirada.',
  403: 'Você não tem permissão para esta operação.',
  404: 'Registro não encontrado.',
}

function ehTexto(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.length > 0
}

/** Converte qualquer corpo de erro da API num único tipo.
 *
 * O status HTTP passado por parâmetro é sempre a fonte da verdade — nunca o
 * campo `status` do corpo, que o contrato declara como `integer | string` e que
 * esta função não lê.
 */
export function traduzirErro(status: number, corpo: unknown): ErroApi {
  if (corpo && typeof corpo === 'object') {
    const validacao = corpo as FormaValidacao
    if (
      validacao.errors &&
      typeof validacao.errors === 'object' &&
      !Array.isArray(validacao.errors)
    ) {
      const campos = Object.fromEntries(
        Object.entries(validacao.errors).map(([campo, mensagens]) => [campo, [...mensagens]]),
      )
      return new ErroApi(status, Object.values(campos).flat(), campos)
    }

    const negocio = corpo as FormaNegocio
    if (Array.isArray(negocio.messages) && negocio.messages.length > 0) {
      return new ErroApi(status, negocio.messages)
    }

    const problema = corpo as FormaProblema
    const mensagens = [problema.title, problema.detail].filter(ehTexto)
    if (mensagens.length > 0) {
      return new ErroApi(status, mensagens)
    }
  }

  const padrao = POR_STATUS[status] ?? 'Erro inesperado no servidor.'
  return new ErroApi(status, [padrao])
}

/** Mensagem pronta para a tela, seja erro da API ou falha de rede. */
export function mensagemDe(erro: unknown): string {
  if (erro instanceof ErroApi) return erro.mensagens.join(' ')
  if (erro instanceof TypeError) return 'Não foi possível falar com o servidor.'
  if (erro instanceof Error) return erro.message
  return 'Erro inesperado.'
}

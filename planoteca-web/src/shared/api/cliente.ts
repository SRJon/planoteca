import { ErroApi, traduzirErro } from './erro'

/**
 * Um array vira a MESMA chave repetida (`?empresas=2&empresas=14`), que é a
 * forma que o model binder do ASP.NET lê para `short[]` sem ambiguidade.
 * Serializar como `"2,14"` também funcionaria hoje, mas depende de coerção
 * implícita do binder — e quebraria em silêncio no dia em que o parâmetro
 * fosse `string[]` e um valor legítimo contivesse vírgula.
 */
export type ValorParametro = string | number | boolean | null | undefined
export type Parametros = Record<string, ValorParametro | readonly ValorParametro[]>

export type Pagina<T> = { itens: T[]; total: number }

export type OpcoesCliente = {
  urlBase: string
  lerToken: () => string | null
  aoExpirar: () => void
}

const PREFIXO = '/api/v1'

function montarBusca(parametros: Parametros | undefined): string {
  if (!parametros) return ''
  const busca = new URLSearchParams()
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor === null || valor === undefined || valor === '') continue
    if (Array.isArray(valor)) {
      // `append`, não `set`: `set` substitui a chave anterior, e um array de
      // três valores viraria um só. Array vazio não emite nada — não filtrar
      // é diferente de filtrar por lista vazia (que não traria nada).
      for (const item of valor) {
        if (item === null || item === undefined || item === '') continue
        busca.append(chave, String(item))
      }
      continue
    }
    busca.set(chave, String(valor))
  }
  const texto = busca.toString()
  return texto === '' ? '' : `?${texto}`
}

export function criarCliente(opcoes: OpcoesCliente) {
  async function bruto(
    caminho: string,
    init: RequestInit,
    parametros?: Parametros,
  ): Promise<Response> {
    const token = opcoes.lerToken()
    const cabecalhos = new Headers(init.headers)
    cabecalhos.set('Accept', 'application/json')
    // O sistema é de locale único (pt-BR). Fixar o cabeçalho evita depender do que o
    // navegador enviar: `InterceptorHandlingMiddleware.cs:36-46` chama
    // `CultureInfo.CreateSpecificCulture` sobre o `Accept-Language` bruto e derruba a API
    // com 500 quando o valor não é uma cultura válida (é o que acontece com o `fetch`
    // nativo do Node, que manda `*` — ver `scripts/api-sync.mjs:32-34`).
    cabecalhos.set('Accept-Language', 'pt-BR')
    if (token !== null) cabecalhos.set('Authorization', `Bearer ${token}`)
    if (init.body !== undefined) cabecalhos.set('Content-Type', 'application/json')

    const url = `${opcoes.urlBase}${PREFIXO}${caminho}${montarBusca(parametros)}`
    const resposta = await fetch(url, { ...init, headers: cabecalhos })

    if (resposta.ok) return resposta

    if (resposta.status === 401) opcoes.aoExpirar()
    let corpo: unknown = null
    try {
      corpo = await resposta.json()
    } catch {
      corpo = null
    }
    throw traduzirErro(resposta.status, corpo)
  }

  async function corpoDe<T>(resposta: Response): Promise<T | null> {
    if (resposta.status === 204) return null
    const texto = await resposta.text()
    if (texto === '') return null
    try {
      return JSON.parse(texto) as T
    } catch {
      throw new ErroApi(resposta.status, ['Resposta do servidor não é JSON válido.'])
    }
  }

  return {
    async obter<T>(caminho: string, parametros?: Parametros): Promise<T | null> {
      return corpoDe<T>(await bruto(caminho, { method: 'GET' }, parametros))
    },

    async listar<T>(caminho: string, parametros?: Parametros): Promise<Pagina<T>> {
      const resposta = await bruto(caminho, { method: 'GET' }, parametros)
      const itens = (await corpoDe<T[]>(resposta)) ?? []
      const cabecalho = resposta.headers.get('X-Total-Count')
      // Cabeçalho ausente e cabeçalho VAZIO caem no mesmo lugar: `Number('')`
      // é 0 e passa em `Number.isFinite`, então sem a checagem de texto em
      // branco um total vazio devolveria 0 em vez de cair no fallback — e
      // `total` governa a paginação (`PaginaProjetos.tsx:92` esconde a
      // paginação com `total > 0`, com linhas na tela).
      const numerico =
        cabecalho === null || cabecalho.trim() === '' ? Number.NaN : Number(cabecalho)
      const total = Number.isFinite(numerico) ? numerico : itens.length
      return { itens, total }
    },

    async enviar<T>(caminho: string, corpo: unknown, parametros?: Parametros): Promise<T | null> {
      const resposta = await bruto(
        caminho,
        { method: 'POST', body: JSON.stringify(corpo) },
        parametros,
      )
      return corpoDe<T>(resposta)
    },

    // `PUT`, ao lado de `enviar` (`POST`): a gestão de vocabulário (RF-09)
    // é a primeira escrita do projeto cujo contrato distingue os dois — criar
    // devolve `201` com o item, alterar devolve `204` sem corpo. Reaproveitar
    // `enviar` para o `PUT` esconderia esse verbo errado atrás de um nome que
    // só fala de "enviar", então o método ganha o nome do verbo que faz.
    async atualizar<T>(caminho: string, corpo: unknown, parametros?: Parametros): Promise<T | null> {
      const resposta = await bruto(
        caminho,
        { method: 'PUT', body: JSON.stringify(corpo) },
        parametros,
      )
      return corpoDe<T>(resposta)
    },

    async remover(caminho: string, parametros?: Parametros): Promise<void> {
      await bruto(caminho, { method: 'DELETE' }, parametros)
    },
  }
}

export type Cliente = ReturnType<typeof criarCliente>

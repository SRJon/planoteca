import { ErroApi } from '@/shared/api'
import type { Cliente, Pagina, Parametros } from '@/shared/api'
import type { Plano, PlanoDetalhe } from './modelo'

/**
 * O recorte que a Biblioteca aplica, como `GET /api/v1/lesson-plans` o
 * aceita.
 *
 * Os identificadores são GUID do vocabulário, e não mais chaves de fio em
 * inglês (`subject=math`): o componente e a série viraram tabela no banco, e
 * o front recebe a lista pronta por `GET /api/v1/vocabulary`. Não há mais um
 * mapa de tradução a manter em sincronia com o back-end.
 */
export type FiltroPlano = {
  /** Busca livre. Varre título, autoria e objetos de conhecimento. */
  busca?: string
  componenteId?: string | null
  serieId?: string | null
  metodologiaId?: string | null
  duracaoMinima?: number | null
  duracaoMaxima?: number | null
  pagina?: number
  tamanhoPagina?: number
}

function paraParametros(filtro: FiltroPlano | undefined): Parametros | undefined {
  if (!filtro) return undefined
  return {
    q: filtro.busca || undefined,
    // `null` significa "sem recorte" e vira parâmetro AUSENTE, não
    // `componente=null` na querystring — o model binder do ASP.NET leria a
    // string "null" como valor, e nenhum plano casaria.
    componente: filtro.componenteId ?? undefined,
    serie: filtro.serieId ?? undefined,
    metodologia: filtro.metodologiaId ?? undefined,
    duracaoMin: filtro.duracaoMinima ?? undefined,
    duracaoMax: filtro.duracaoMaxima ?? undefined,
    page: filtro.pagina,
    perPage: filtro.tamanhoPagina,
  }
}

/**
 * Busca a página de planos.
 *
 * Não há `paraDominio` aqui, ao contrário de `entities/pessoa`: a API já
 * responde no formato do domínio, em camelCase e em português. Se o contrato
 * divergir um dia, é neste arquivo que o mapeador nasce, e nenhuma tela
 * percebe.
 *
 * `cliente.listar` absorve o 204 sem corpo (vira lista vazia) e lê o total do
 * cabeçalho `X-Total-Count`.
 */
export async function listarPlanos(
  cliente: Cliente,
  filtro?: FiltroPlano,
): Promise<Pagina<Plano>> {
  return cliente.listar<Plano>('/lesson-plans', paraParametros(filtro))
}

/**
 * A ficha de um plano. `null` quando não existe.
 *
 * O 404 vira `null` em vez de erro porque, para quem chega pela URL, as duas
 * respostas do back-end dizem a mesma coisa: **este plano não está no acervo
 * público**. A API responde 404 tanto para um id inexistente quanto para um
 * plano em rascunho — de propósito, para não vazar a existência de plano não
 * publicado (um 403 diria "existe, mas você não pode ver").
 *
 * Tratar aqui, e não na tela, é o que deixa a página distinguir "não achei"
 * de "a rede falhou": a primeira é uma tela de "plano não encontrado", a
 * segunda é um alerta de erro com o motivo.
 */
export async function buscarPlano(cliente: Cliente, id: string): Promise<PlanoDetalhe | null> {
  try {
    return await cliente.obter<PlanoDetalhe>(`/lesson-plans/${id}`)
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 404) return null
    throw erro
  }
}

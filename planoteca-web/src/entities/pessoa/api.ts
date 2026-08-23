import type { Cliente, Pagina, Parametros } from '@/shared/api'
import { paraDominio } from './mapeador'
import type { PessoaApi } from './mapeador'
import type { Pessoa } from './modelo'

/**
 * `GET /api/v1/person-samples` aceita estes parâmetros de busca — o
 * `FilterDto` do back-end (`page`, `per_page`, `sort`, `filter`) mais o
 * `active`, que o controller lê à parte.
 *
 * `sort` já chega pronto (PascalCase, prefixo `-` para descendente) — a
 * tradução do nome de campo do domínio é trabalho da feature
 * `filtrar-pessoas`, não desta fatia.
 */
export type FiltroPessoa = {
  page?: number
  perPage?: number
  sort?: string
  filter?: string
  active?: boolean
}

function paraParametros(filtro: FiltroPessoa | undefined): Parametros | undefined {
  if (!filtro) return undefined
  return {
    page: filtro.page,
    per_page: filtro.perPage,
    sort: filtro.sort,
    filter: filtro.filter,
    active: filtro.active,
  }
}

/**
 * Busca a lista de pessoas e já devolve domínio — `cliente.listar` absorve
 * o 204 sem corpo (vira lista vazia) e o `X-Total-Count` fora do schema
 * declarado (`shared/api/cliente.ts`); este módulo só aplica `paraDominio`
 * item a item.
 *
 * Recebe `cliente` por parâmetro: este pacote é `entities`, que só importa
 * de `shared`; quem decide de onde vem o `Cliente` concreto é quem monta a
 * tela.
 */
export async function listarPessoas(
  cliente: Cliente,
  filtro?: FiltroPessoa,
): Promise<Pagina<Pessoa>> {
  const pagina = await cliente.listar<PessoaApi>('/person-samples', paraParametros(filtro))
  return { itens: pagina.itens.map(paraDominio), total: pagina.total }
}

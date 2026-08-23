import type { Cliente, Pagina, Parametros } from '@/shared/api'
import type { Conta, Papel } from './modelo'

export type FiltroConta = {
  busca?: string
  pagina?: number
  tamanhoPagina?: number
}

function paraParametros(filtro: FiltroConta | undefined): Parametros | undefined {
  if (!filtro) return undefined
  return {
    q: filtro.busca || undefined,
    page: filtro.pagina,
    perPage: filtro.tamanhoPagina,
  }
}

/** Quem se cadastrou, com o que cada um escreveu. Só o administrador vê. */
export async function listarContas(cliente: Cliente, filtro?: FiltroConta): Promise<Pagina<Conta>> {
  return cliente.listar<Conta>('/admin/people', paraParametros(filtro))
}

/** Promove a administrador ou rebaixa a professor.
 *
 * A API recusa quando o alvo é quem pede (auto-rebaixamento) e quando seria
 * o último administrador — as duas guardas são do SERVIDOR; esta função só
 * transporta o pedido e deixa o erro dele subir. */
export async function alterarPapel(cliente: Cliente, id: string, papel: Papel): Promise<void> {
  await cliente.enviar(`/admin/people/${id}/papel`, { papel })
}

/** Ativa ou desativa a conta. Mesma ressalva de `alterarPapel` sobre as
 * guardas: auto-desativação e último administrador são recusados pela API. */
export async function alterarAtivo(cliente: Cliente, id: string, ativo: boolean): Promise<void> {
  await cliente.enviar(`/admin/people/${id}/ativo`, { ativo })
}

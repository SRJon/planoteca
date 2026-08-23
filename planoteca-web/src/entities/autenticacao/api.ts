import type { Cliente } from '@/shared/api'
import type { Sessao } from './modelo'

/**
 * Quem sou eu, na Planoteca.
 *
 * O token do Firebase vai no cabeçalho (o `Cliente` o injeta), e a API
 * devolve a pessoa com o PAPEL — que o Firebase não sabe. É também onde o
 * cadastro nasce, no primeiro acesso.
 */
export async function buscarSessao(cliente: Cliente): Promise<Sessao | null> {
  return cliente.obter<Sessao>('/auth/me')
}

import { useQuery } from '@tanstack/react-query'
import type { Cliente } from '@/shared/api'
import { buscarVocabulario } from './api'
import { VOCABULARIO_VAZIO } from './modelo'
import type { Vocabulario } from './modelo'

/** A chave de cache. Sem parâmetro: o vocabulário é um só. */
export const CHAVE_VOCABULARIO = ['vocabulario'] as const

/**
 * O vocabulário, em cache.
 *
 * `staleTime` de uma hora, e não o padrão de zero: componente, série e
 * metodologia mudam quando um administrador cadastra algo — o que acontece
 * raramente, e nunca durante a navegação de um professor. Buscar de novo a
 * cada montagem de tela gastaria uma requisição por filtro aberto, contra um
 * back-end que hiberna no plano gratuito.
 *
 * Quem cadastrar um item novo pelo painel precisa invalidar
 * `CHAVE_VOCABULARIO` para a lista aparecer sem recarregar a página.
 */
export function useVocabulario(cliente: Cliente) {
  const consulta = useQuery({
    queryKey: CHAVE_VOCABULARIO,
    queryFn: () => buscarVocabulario(cliente),
    staleTime: 60 * 60 * 1000,
  })

  // O vazio como valor corrente evita `vocabulario?.componentes ?? []` em
  // cada consumidor. Um filtro sem opção é um estado legítimo: enquanto a
  // busca está em voo, ou quando a base ainda não tem seed.
  const vocabulario: Vocabulario = consulta.data ?? VOCABULARIO_VAZIO

  return {
    vocabulario,
    carregando: consulta.isPending,
    erro: consulta.error,
  }
}

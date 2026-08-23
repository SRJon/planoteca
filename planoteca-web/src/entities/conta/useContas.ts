import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Cliente } from '@/shared/api'
import { alterarAtivo, alterarPapel, listarContas } from './api'
import type { FiltroConta } from './api'
import type { Papel } from './modelo'

/** A raiz das chaves de cache do painel de pessoas. */
export const CHAVE_CONTAS = ['contas'] as const

export function useContas(cliente: Cliente, filtro?: FiltroConta) {
  return useQuery({
    queryKey: [...CHAVE_CONTAS, filtro],
    queryFn: () => listarContas(cliente, filtro),
    placeholderData: keepPreviousData,
  })
}

export function useAlterarPapel(cliente: Cliente) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, papel }: { id: string; papel: Papel }) => alterarPapel(cliente, id, papel),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_CONTAS }),
  })
}

export function useAlterarAtivo(cliente: Cliente) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => alterarAtivo(cliente, id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE_CONTAS }),
  })
}

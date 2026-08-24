import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Cliente } from '@/shared/api'
import {
  alterarComponente,
  alterarMetodologia,
  alterarSerie,
  buscarVocabulario,
  buscarVocabularioAdmin,
  criarComponente,
  criarMetodologia,
  criarSerie,
} from './api'
import type { ComponenteEntrada, MetodologiaEntrada, SerieEntrada } from './api'
import { VOCABULARIO_VAZIO } from './modelo'
import type { Vocabulario } from './modelo'

/** A chave de cache. Sem parâmetro: o vocabulário é um só. */
export const CHAVE_VOCABULARIO = ['vocabulario'] as const

/**
 * A chave da leitura administrativa — inclui o inativo (RF-03).
 *
 * É IRMÃ de `CHAVE_VOCABULARIO`, e não filha: `['vocabulario', 'admin']`
 * teria a chave pública como prefixo, e `invalidateQueries` casa por
 * prefixo. As duas invalidações abaixo viraram uma só em silêncio, e o dia
 * em que alguém invalidasse só a pública levaria a administrativa junto,
 * sem que a linha dissesse isso.
 */
export const CHAVE_VOCABULARIO_ADMIN = ['vocabulario-admin'] as const

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

/**
 * O vocabulário completo, inativo incluso — a fonte da tela de gestão
 * (RF-03). Sem `staleTime` alto: quem administra acabou de cadastrar algo e
 * espera ver o resultado, ao contrário de quem só filtra a Biblioteca.
 */
export function useVocabularioAdmin(cliente: Cliente) {
  const consulta = useQuery({
    queryKey: CHAVE_VOCABULARIO_ADMIN,
    queryFn: () => buscarVocabularioAdmin(cliente),
  })

  const vocabulario: Vocabulario = consulta.data ?? VOCABULARIO_VAZIO

  return {
    vocabulario,
    carregando: consulta.isPending,
    erro: consulta.error,
  }
}

/**
 * As três mutações de escrita, todas com a MESMA invalidação: as duas
 * chaves de vocabulário (RF-08).
 *
 * Invalidar só `CHAVE_VOCABULARIO_ADMIN` deixaria a Biblioteca pública com o
 * item novo escondido por até uma hora (`staleTime` de `useVocabulario`);
 * invalidar só `CHAVE_VOCABULARIO` deixaria a própria tela de gestão sem
 * mostrar o que acabou de cadastrar. As chaves são irmãs, então nenhuma das
 * duas alcança a outra por prefixo: as duas linhas precisam existir.
 */
function useSalvarVocabulario<TEntrada>(
  cliente: Cliente,
  salvar: (cliente: Cliente, entrada: TEntrada) => Promise<unknown>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entrada: TEntrada) => salvar(cliente, entrada),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAVE_VOCABULARIO })
      queryClient.invalidateQueries({ queryKey: CHAVE_VOCABULARIO_ADMIN })
    },
  })
}

/** Cadastra ou altera um componente, conforme `id` vier preenchido ou não —
 * a mesma tela de gestão serve as duas ações (Task 5). */
export function useSalvarComponente(cliente: Cliente) {
  return useSalvarVocabulario(cliente, (c, { id, ...entrada }: ComponenteEntrada & { id?: string }) =>
    id ? alterarComponente(c, id, entrada) : criarComponente(c, entrada),
  )
}

/** Cadastra ou altera uma série. Mesma forma de `useSalvarComponente`. */
export function useSalvarSerie(cliente: Cliente) {
  return useSalvarVocabulario(cliente, (c, { id, ...entrada }: SerieEntrada & { id?: string }) =>
    id ? alterarSerie(c, id, entrada) : criarSerie(c, entrada),
  )
}

/** Cadastra ou altera uma metodologia. Mesma forma de `useSalvarComponente`. */
export function useSalvarMetodologia(cliente: Cliente) {
  return useSalvarVocabulario(cliente, (c, { id, ...entrada }: MetodologiaEntrada & { id?: string }) =>
    id ? alterarMetodologia(c, id, entrada) : criarMetodologia(c, entrada),
  )
}

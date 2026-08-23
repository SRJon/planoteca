import type { Sessao } from '@/entities/autenticacao'
import { criarCliente } from '@/shared/api'
import { ContextoAutenticacao } from '@/app/providers/AutenticacaoProvider'
import type { Autenticacao } from '@/app/providers/AutenticacaoProvider'

/**
 * Uma sessão de teste.
 *
 * `papel` é o parâmetro que importa: quase todo teste de painel existe para
 * provar que professor e administrador veem coisas diferentes.
 */
export function sessaoDeTeste(papel: Sessao['papel'] = 'administrador'): Sessao {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'pessoa@escola.test',
    nome: 'Pessoa de Teste',
    papel,
    ativo: true,
    novo: false,
  }
}

/**
 * O cliente HTTP dos testes: sem token, apontando para a base que o MSW
 * intercepta.
 */
export function clienteDeTeste(urlBase = 'https://api.teste') {
  return criarCliente({ urlBase, lerToken: () => null, aoExpirar: () => {} })
}

/**
 * Monta uma árvore com sessão, sem tocar no Firebase.
 *
 * `sessao: null` simula visitante; `carregando: true` simula o instante em
 * que o SDK ainda não respondeu — o estado que a guarda de rota precisa
 * distinguir de "não tem sessão".
 */
export function ComAutenticacao({
  children,
  sessao = sessaoDeTeste(),
  carregando = false,
  disponivel = true,
  sair = async () => {},
}: {
  children: React.ReactNode
  sessao?: Sessao | null
  carregando?: boolean
  disponivel?: boolean
  /** Sobrescrevível para o teste provar que a saída foi chamada. */
  sair?: () => Promise<void>
}) {
  const valor: Autenticacao = {
    sessao,
    carregando,
    cliente: clienteDeTeste(),
    disponivel,
    entrarComGoogle: async () => {},
    entrarComSenha: async () => {},
    cadastrarComSenha: async () => {},
    sair,
  }

  return <ContextoAutenticacao.Provider value={valor}>{children}</ContextoAutenticacao.Provider>
}

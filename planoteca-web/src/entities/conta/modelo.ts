/**
 * O papel, duplicado de `entities/autenticacao`.
 *
 * `entities` não importa `entities` (fronteira de camada) — o mesmo motivo
 * pelo qual `entities/plano/modelo.ts` duplica os tipos de vocabulário em vez
 * de importá-los. As duas listas precisam mudar juntas se um papel novo
 * nascer.
 */
export const PAPEIS_CONTA = ['professor', 'administrador'] as const
export type Papel = (typeof PAPEIS_CONTA)[number]

/**
 * Uma pessoa cadastrada, do ponto de vista de quem administra.
 *
 * Não confundir com `Sessao` (`entities/autenticacao`): `Sessao` é "quem sou
 * eu, agora"; `Conta` é "quem é essa outra pessoa", numa linha do painel.
 */
export type Conta = {
  id: string
  nome: string
  email: string
  papel: Papel
  ativo: boolean
  criadoEm: string
  /** Textos do blog que esta pessoa já publicou. */
  postsPublicados: number
  /** Textos que ainda aguardam moderação. */
  postsPendentes: number
}

/** O que cada papel PODE fazer — a interface explica a permissão em vez de
 * só nomear o papel. */
export const DESCRICAO_PAPEL: Record<Papel, string> = {
  professor: 'Escreve para o blog. Os textos entram na fila de moderação.',
  administrador: 'Modera o blog, cataloga planos e controla o acesso de outras contas.',
}

export const ROTULO_PAPEL: Record<Papel, string> = {
  professor: 'Professor',
  administrador: 'Administrador',
}

/** O primeiro nome, para uma confirmação que trata a pessoa como pessoa,
 * não como uma linha de tabela. */
export function primeiroNomeDe(conta: Conta): string {
  const nome = conta.nome.trim()
  return nome === '' ? conta.email : (nome.split(/\s+/)[0] ?? nome)
}

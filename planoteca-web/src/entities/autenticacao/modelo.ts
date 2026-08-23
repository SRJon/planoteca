/**
 * Quem está usando a Planoteca.
 *
 * ── A divisão entre Firebase e Planoteca ─────────────────────────────────
 *
 * O **Firebase autentica**: prova que quem chegou é dono do e-mail, e emite
 * um token. A **Planoteca autoriza**: o papel mora no nosso banco.
 *
 * Por isso este tipo NÃO é o `User` do Firebase. Ele é o que
 * `GET /api/v1/auth/me` devolve — a pessoa como o sistema a conhece, com o
 * papel que decide o que ela vê.
 */
export type Sessao = {
  id: string
  email: string
  nome: string
  papel: Papel
  ativo: boolean
  /** `true` quando este login criou o cadastro. A interface dá as
   * boas-vindas em vez de um retorno silencioso. */
  novo: boolean
}

export const PAPEIS = ['professor', 'administrador'] as const
export type Papel = (typeof PAPEIS)[number]

/**
 * Se esta sessão administra o acervo.
 *
 * **Isto desenha a interface; não autoriza.** Esconder um item de menu evita
 * levar alguém a uma tela de 403 — a proteção real é do servidor, por
 * operação, e existe com ou sem esta função. Mesmo princípio de
 * `app/shell/permissoes.ts`.
 */
export function ehAdministrador(sessao: Sessao | null): boolean {
  return sessao?.papel === 'administrador'
}

/** O primeiro nome, para saudar sem soar formal demais. */
export function primeiroNome(sessao: Sessao | null): string {
  if (!sessao) return ''
  const nome = sessao.nome.trim()
  return nome === '' ? sessao.email : (nome.split(/\s+/)[0] ?? nome)
}

/** As iniciais do avatar. Duas letras, ou uma quando o nome é só uma palavra. */
export function iniciais(sessao: Sessao | null): string {
  if (!sessao) return '?'
  const partes = sessao.nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return sessao.email.slice(0, 1).toUpperCase()
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : ''
  return (primeira + ultima).toUpperCase()
}

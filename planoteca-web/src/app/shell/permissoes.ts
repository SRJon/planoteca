import type { Icon } from '@phosphor-icons/react'
import { Books } from '@phosphor-icons/react/dist/csr/Books'
import { FilePlus } from '@phosphor-icons/react/dist/csr/FilePlus'
import { Files } from '@phosphor-icons/react/dist/csr/Files'
import { NotePencil } from '@phosphor-icons/react/dist/csr/NotePencil'
import { Tray } from '@phosphor-icons/react/dist/csr/Tray'
import type { Papel, Sessao } from '@/entities/autenticacao'

/**
 * O MENU DA ÁREA DE TRABALHO — a mesa de quem mantém o acervo.
 *
 * As três áreas públicas (Início, Biblioteca, Blog) ficam em
 * `LayoutPublico` e não passam por aqui: são as mesmas para todo mundo, com
 * ou sem conta, e portanto não têm o que filtrar.
 *
 * ── O que este arquivo NÃO faz: autorizar ────────────────────────────────
 *
 * Esconder um item de menu desenha a interface; não fecha a URL
 * correspondente, e não é para fechar. A autorização real é do servidor, por
 * operação — hoje `[Authorize(Policy = "Administrador")]` nos controllers da
 * API. Quem digitar `/admin/planos` sem ser administrador chega à tela e
 * recebe 403 do back-end, que é a resposta honesta.
 *
 * ── Como declarar um item ────────────────────────────────────────────────
 *
 * ```ts
 * { rota: '/admin/escrever', titulo: 'Escrever', icone: NotePencil }
 * { rota: '/admin/planos', titulo: 'Planos', icone: Files, papel: 'administrador' }
 * ```
 *
 * Omitir `papel` é a escolha certa para o que todo mundo com conta faz.
 */

/** Um item de topo da barra lateral. */
export type ItemMenu = {
  /** O caminho que o item abre. Precisa existir em `app/rotas/Rotas.tsx` —
   * um item que aponta para rota inexistente leva ao `Navigate` de fallback,
   * que é exatamente o caminho sem saída que este módulo evita. */
  rota: string
  titulo: string
  /** O ícone do Phosphor que representa o item.
   *
   * Mora AQUI, e não na `BarraLateral`, porque é parte da declaração do
   * item: é a ÚNICA coisa visível quando a barra está recolhida. */
  icone: Icon
  /** O papel que o item EXIGE. Ausente = todo usuário com conta vê. */
  papel?: Papel
}

/**
 * O menu da Planoteca.
 *
 * A ordem não é alfabética nem casual: moderação primeiro porque é o que
 * **precisa de atenção** — o briefing diz que o painel "mostra primeiro o
 * que precisa de atenção: textos aguardando aprovação".
 *
 * Escrever é o único item sem `papel`: qualquer professor cadastrado escreve
 * para o blog. Os outros três são de quem administra o acervo.
 */
export const ITENS_MENU: ItemMenu[] = [
  { rota: '/admin/moderacao', titulo: 'Moderação', icone: Tray, papel: 'administrador' },
  { rota: '/admin/planos', titulo: 'Planos', icone: Files, papel: 'administrador' },
  { rota: '/admin/catalogar', titulo: 'Catalogar', icone: FilePlus, papel: 'administrador' },
  { rota: '/admin/escrever', titulo: 'Escrever', icone: NotePencil },
  { rota: '/biblioteca', titulo: 'Biblioteca', icone: Books },
]

/**
 * Os itens que esta sessão deve VER. Pura: nenhuma rede, nenhum estado.
 *
 * ── Degradação: falha FECHADA, e é diferente do que era ──────────────────
 *
 * O filtro anterior falhava ABERTO — quando os grupos do diretório não
 * chegavam, o menu mostrava tudo, porque a lista vazia era indistinguível de
 * "ainda não carregou".
 *
 * Aqui não existe esse estado intermediário: o papel vem junto com a sessão,
 * numa resposta só (`GET /auth/me`). Ou há sessão com papel, ou não há
 * sessão. Sem sessão, nenhum item — o que é correto, porque a barra lateral
 * só existe dentro de `RotaProtegida`.
 */
export function filtrarMenu(itens: ItemMenu[], sessao: Sessao | null): ItemMenu[] {
  if (sessao === null) return []
  return itens.filter((item) => item.papel === undefined || item.papel === sessao.papel)
}

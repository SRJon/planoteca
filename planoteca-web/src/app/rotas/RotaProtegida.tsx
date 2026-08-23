import { Navigate, Outlet, useLocation } from 'react-router'
import { useAutenticacao } from '../providers/AutenticacaoProvider'

/**
 * Guarda de rota: nega por padrão, mas ESPERA antes de negar.
 *
 * ── Os três estados, e por que o intermediário importa ───────────────────
 *
 * 1. `carregando`: o Firebase ainda não disse se há sessão. Redirecionar
 *    aqui expulsaria quem ESTÁ logado, no primeiro render de toda visita —
 *    o SDK lê o armazenamento de forma assíncrona, e no instante zero não há
 *    sessão nenhuma. É a diferença entre "não tem sessão" e "ainda não sei".
 * 2. `sessao === null`: visitante. Vai para `/entrar`.
 * 3. `sessao` existe: renderiza.
 *
 * ── Isto DESENHA a navegação; não é controle de acesso ───────────────────
 *
 * A autorização real é do servidor, por operação — inclusive nos GET. Uma
 * rota renderizada aqui sem o back-end aceitar o token não expõe dado
 * nenhum sozinha; só evita levar quem não tem sessão a uma tela que
 * responderia 401 de qualquer forma.
 *
 * ── Por que a guarda NÃO checa papel ─────────────────────────────────────
 *
 * Ela pergunta uma coisa só: existe sessão? Não distingue professor de
 * administrador. Três razões:
 *
 * 1. Não protegeria nada. Uma guarda que redireciona por papel continua
 *    sendo código do navegador, e quem quiser o dado chama a API direto. A
 *    proteção de verdade é a do servidor — hoje `[Authorize(Policy =
 *    "Administrador")]` nos controllers —, e ela existe com ou sem esta
 *    guarda.
 * 2. O menu já faz o trabalho que cabe ao front. Esconder o item
 *    (`filtrarMenu`, em `app/shell/permissoes.ts`) é o que evita levar
 *    alguém a uma tela de 403.
 * 3. Quem chega pela URL direta deve esbarrar no SERVIDOR, e ver o 403 da
 *    tela — que é a resposta honesta, não um redirecionamento que finge que
 *    a rota não existe.
 */
export function RotaProtegida() {
  const { sessao, carregando } = useAutenticacao()
  const local = useLocation()

  if (carregando) {
    return <p className="px-6 py-10 text-muted-foreground">Verificando o acesso…</p>
  }

  if (sessao === null) {
    // O destino viaja junto, para a tela de entrar devolver a pessoa ao
    // lugar que ela pediu. Sem isto, quem abre um link direto para a fila de
    // moderação — o caso normal de quem recebe um aviso — entra e cai numa
    // tela genérica, tendo de navegar de novo até onde já estava indo.
    return <Navigate to="/entrar" replace state={{ de: local.pathname + local.search }} />
  }

  return <Outlet />
}

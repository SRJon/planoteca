import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { buscarSessao } from '@/entities/autenticacao'
import type { Sessao } from '@/entities/autenticacao'
import { criarCliente } from '@/shared/api'
import type { Cliente } from '@/shared/api'
import { ambiente } from '@/shared/config'
import { obterAuth, provedorGoogle } from '@/shared/firebase/cliente'

type Autenticacao = {
  /** A pessoa como a Planoteca a conhece. `null` para visitante. */
  sessao: Sessao | null
  /** `true` enquanto o Firebase ainda não disse se há sessão. Diferente de
   * "não há sessão": a guarda de rota precisa esperar, senão expulsa quem
   * está logado no primeiro render. */
  carregando: boolean
  /** O cliente HTTP, já com o token injetado. */
  cliente: Cliente
  /** `false` quando o Firebase não está configurado — a interface mostra que
   * o login está indisponível em vez de oferecer um botão que não funciona. */
  disponivel: boolean
  entrarComGoogle: () => Promise<void>
  entrarComSenha: (email: string, senha: string) => Promise<void>
  cadastrarComSenha: (nome: string, email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
}

/**
 * O contexto é EXPORTADO para que os testes possam montar uma árvore com
 * sessão sem falar com o Firebase.
 *
 * A alternativa — simular o SDK inteiro com `vi.mock` — testaria o mock, não
 * a aplicação: o que cada tela precisa é de uma sessão, e de onde ela veio é
 * problema do provedor real, coberto pelos testes dele.
 */
export const ContextoAutenticacao = createContext<Autenticacao | null>(null)

/**
 * O token corrente, numa caixa de módulo.
 *
 * Fora do componente de propósito. O `Cliente` precisa lê-lo no MOMENTO da
 * requisição, e um `useRef` lido durante o render é o que o compilador do
 * React proíbe — com razão: o valor de um ref durante o render não é
 * confiável entre renderizações concorrentes.
 *
 * Aqui a leitura acontece dentro do closure `lerToken`, chamado quando a
 * requisição sai. A aplicação tem um provedor só, então o escopo de módulo é
 * exatamente o escopo do estado.
 */
let tokenCorrente: string | null = null

/** Guarda o token que o SDK acabou de emitir. */
function gravarToken(token: string | null): void {
  tokenCorrente = token
}

/** Lê o token no momento da REQUISIÇÃO — nunca durante o render. */
function lerToken(): string | null {
  return tokenCorrente
}

export type { Autenticacao }

/**
 * A sessão da Planoteca, do login ao token.
 *
 * ── O que este provedor resolve, e o anterior não ────────────────────────
 *
 * O `SessaoProvider` do boilerplate guardava um token opaco no
 * `sessionStorage` e o via vencer: sem rota de renovação no back-end, a
 * pessoa era devolvida ao login a cada hora. A lacuna estava documentada lá
 * e é o motivo de este provedor existir.
 *
 * Aqui o SDK do Firebase cuida disso. `onIdTokenChanged` dispara no login, no
 * logout E **a cada renovação automática** — o SDK renova o token antes de
 * ele vencer, sozinho. A sessão deixa de ter prazo.
 *
 * ── Por que a sessão vem da API, e não do Firebase ───────────────────────
 *
 * O `User` do Firebase sabe o e-mail e o nome. Não sabe o PAPEL, que decide
 * se a pessoa vê o painel — e não deveria saber: um custom claim seria
 * alterável pelo console, sem passar por revisão. Cada token novo dispara
 * uma ida a `/auth/me`, que é a fonte da verdade.
 */
export function AutenticacaoProvider({ children }: { children: React.ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null)
  // `true` só quando há Firebase para esperar. Sem ele, o estado inicial já é
  // o definitivo — e marcar `carregando` para depois desmarcar num efeito
  // provocaria uma renderização em cascata sem ganhar nada.
  const [carregando, setCarregando] = useState(() => obterAuth() !== null)

  /**
   * O token corrente, em `ref` e não em `state`.
   *
   * O `Cliente` precisa lê-lo no momento da requisição, e um `state` faria o
   * cliente ser recriado a cada renovação — invalidando o cache do TanStack
   * Query junto, porque ele entra na chave de várias consultas.
   */
  const auth = obterAuth()
  const disponivel = auth !== null

  /**
   * O cliente HTTP.
   *
   * `useMemo` com `[]` porque ele precisa ser o MESMO objeto entre
   * renderizações: ele entra na chave de várias consultas do TanStack Query,
   * e recriá-lo invalidaria o cache a cada renovação de token — de hora em
   * hora.
   *
   * `aoExpirar` só é chamado dentro de uma requisição, nunca no render.
   */
  const cliente = useMemo(
    () =>
      criarCliente({
        urlBase: ambiente.urlApi,
        lerToken,
        aoExpirar: () => {
          // 401 com token que o Firebase considera válido significa que a
          // sessão morreu do lado de cá — conta desativada, ou o registro
          // sumiu. Derrubar é a única saída honesta.
          gravarToken(null)
          setSessao(null)
        },
      }),
    [],
  )

  useEffect(() => {
    if (!auth) {
      // ── A porta de teste, e por que ela é segura ──────────────────────
      //
      // O login acontece no NAVEGADOR, contra os servidores do Google. O
      // Playwright não tem como fazê-lo, e simular o SDK inteiro testaria o
      // mock em vez da aplicação. Esta porta permite que o e2e prove o que
      // vem DEPOIS do login — que o painel abre, que o menu filtra, que a
      // moderação funciona.
      //
      // Três guardas, e as três precisam ceder para ela abrir:
      //
      // 1. `import.meta.env.DEV` é `false` em `npm run build`, e o
      //    Vite/Rollup ELIMINA este ramo inteiro do bundle de produção por
      //    análise estática. O código não existe lá — não é uma condição que
      //    alguém possa satisfazer.
      // 2. Só vale quando o Firebase está AUSENTE. Com ele configurado, este
      //    caminho nem é alcançado.
      // 3. A sessão vem de `GET /auth/me`, que em produção exige token
      //    válido. A porta abre a interface, nunca o dado.
      if (import.meta.env.DEV) {
        const janela = window as unknown as Record<string, unknown>
        if (janela['__PLANOTECA_SESSAO_TESTE__'] === true) {
          void buscarSessao(cliente).then(setSessao).catch(() => setSessao(null))
        }
      }

      // Sem Firebase configurado não há o que esperar. O estado inicial de
      // `carregando` já leva isso em conta (ver o `useState` acima).
      return
    }

    // Dispara no login, no logout e a cada RENOVAÇÃO do token.
    const cancelar = onIdTokenChanged(auth, async (usuario: User | null) => {
      if (!usuario) {
        gravarToken(null)
        setSessao(null)
        setCarregando(false)
        return
      }

      try {
        gravarToken(await usuario.getIdToken())
        setSessao(await buscarSessao(cliente))
      } catch {
        // A API não respondeu, ou recusou. O token do Firebase continua
        // válido, mas sem a sessão da Planoteca não há papel — e sem papel
        // não há o que mostrar no painel.
        gravarToken(null)
        setSessao(null)
      } finally {
        setCarregando(false)
      }
    })

    return cancelar
  }, [auth, cliente])

  const entrarComGoogle = useCallback(async () => {
    if (!auth) throw new Error('O login não está configurado neste ambiente.')
    // `signInWithPopup`, e não `signInWithRedirect`: o redirect perde o
    // estado da página e, em navegadores que bloqueiam cookie de terceiro,
    // falha em silêncio. O popup pede permissão explícita, que é visível.
    await signInWithPopup(auth, provedorGoogle())
    // Não há `setSessao` aqui: quem grava é o `onIdTokenChanged`, que dispara
    // logo em seguida. Gravar nos dois lugares criaria duas fontes da verdade.
  }, [auth])

  const entrarComSenha = useCallback(
    async (email: string, senha: string) => {
      if (!auth) throw new Error('O login não está configurado neste ambiente.')
      await signInWithEmailAndPassword(auth, email.trim(), senha)
    },
    [auth],
  )

  const cadastrarComSenha = useCallback(
    async (nome: string, email: string, senha: string) => {
      if (!auth) throw new Error('O login não está configurado neste ambiente.')
      const credencial = await createUserWithEmailAndPassword(auth, email.trim(), senha)
      // O nome vai para o perfil do Firebase ANTES de a API resolver a
      // sessão: é dele que o back-end tira o nome no primeiro acesso. Sem
      // isto, o cadastro nasceria com a parte antes do @ como nome.
      await updateProfile(credencial.user, { displayName: nome.trim() })
      // Força um token novo, agora com o `name` preenchido.
      await credencial.user.getIdToken(true)
    },
    [auth],
  )

  const sair = useCallback(async () => {
    if (!auth) return
    await signOut(auth)
  }, [auth])

  const valor = useMemo(
    () => ({
      sessao,
      carregando,
      cliente,
      disponivel,
      entrarComGoogle,
      entrarComSenha,
      cadastrarComSenha,
      sair,
    }),
    [sessao, carregando, cliente, disponivel, entrarComGoogle, entrarComSenha, cadastrarComSenha, sair],
  )

  return <ContextoAutenticacao.Provider value={valor}>{children}</ContextoAutenticacao.Provider>
}

export function useAutenticacao(): Autenticacao {
  const contexto = useContext(ContextoAutenticacao)
  if (contexto === null) {
    throw new Error('useAutenticacao precisa estar dentro de AutenticacaoProvider')
  }
  return contexto
}

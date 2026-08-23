import { useState } from 'react'
import { GoogleLogo } from '@phosphor-icons/react/dist/csr/GoogleLogo'
import { Link, Navigate, useLocation } from 'react-router'
import { Marca } from '@/components/marca'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Traduz o erro do Firebase para algo que um professor entenda.
 *
 * O SDK devolve códigos como `auth/invalid-credential`, e mostrá-los na tela
 * seria despejar detalhe de implementação em quem só quer entrar.
 */
function mensagemDoErro(erro: unknown): string {
  const codigo = (erro as { code?: string })?.code ?? ''

  switch (codigo) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      // A mesma mensagem para os três: dizer "este e-mail não existe"
      // confirmaria a quem tentasse adivinhar que a conta existe.
      return 'E-mail ou senha incorretos.'
    case 'auth/email-already-in-use':
      return 'Já existe uma conta com este e-mail. Entre em vez de criar.'
    case 'auth/weak-password':
      return 'A senha precisa de ao menos 6 caracteres.'
    case 'auth/invalid-email':
      return 'Esse e-mail não parece válido.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      // Fechar a janela do Google não é erro — é desistência. Mostrar um
      // alerta vermelho para quem só mudou de ideia é hostil.
      return ''
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela do Google. Libere os pop-ups para este site.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Espere alguns minutos antes de tentar de novo.'
    case 'auth/network-request-failed':
      return 'Sem conexão com o servidor de login. Verifique a internet.'
    default:
      return erro instanceof Error && erro.message
        ? erro.message
        : 'Não foi possível entrar. Tente de novo.'
  }
}

/**
 * A entrada da Planoteca.
 *
 * ── Quem chega aqui, e quem não ──────────────────────────────────────────
 *
 * Esta tela serve a quem vai ESCREVER no blog ou ADMINISTRAR o acervo.
 * Nenhum professor precisa dela para baixar um plano: a Biblioteca inteira é
 * pública. Por isso a página tem uma saída visível para o acervo — quem
 * chegou aqui por engano não deveria ficar preso.
 */
export type PaginaEntrarProps = {
  /** Quem já entrou é levado para a área de trabalho — esta tela não tem o
   * que oferecer a ele. */
  temSessao: boolean
  carregando: boolean
  /** `false` quando o Firebase não está configurado. */
  disponivel: boolean
  entrarComGoogle: () => Promise<void>
  entrarComSenha: (email: string, senha: string) => Promise<void>
  cadastrarComSenha: (nome: string, email: string, senha: string) => Promise<void>
}

/**
 * Recebe tudo por PROP, e não do contexto: `pages/` não importa de `app/`
 * (fronteira imposta por `eslint-plugin-boundaries`), e o provedor de
 * autenticação vive lá. Quem conecta é `app/rotas/Rotas.tsx` — o mesmo
 * padrão das demais páginas, que recebem `cliente`.
 */
export function PaginaEntrar({
  temSessao,
  carregando,
  disponivel,
  entrarComGoogle,
  entrarComSenha,
  cadastrarComSenha,
}: PaginaEntrarProps) {
  const local = useLocation()
  // Para onde voltar depois de entrar. `RotaProtegida` grava aqui o caminho
  // que a pessoa pediu; sem ele, o padrão é a fila de moderação.
  const destino = (local.state as { de?: string } | null)?.de ?? '/admin/moderacao'

  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Quem já entrou não vê a tela de entrar. `replace` para o botão de voltar
  // não devolver a pessoa ao formulário.
  if (temSessao) return <Navigate to={destino} replace />

  async function tentar(acao: () => Promise<void>) {
    setErro('')
    setEnviando(true)
    try {
      await acao()
    } catch (falha) {
      setErro(mensagemDoErro(falha))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 md:grid-cols-2">
      <aside
        className="hidden flex-col gap-6 p-10 md:flex"
        style={{
          background: 'linear-gradient(160deg, var(--marca-grad-de), var(--marca-grad-ate))',
          color: 'var(--marca-ink)',
        }}
      >
        <Link to="/" className="flex w-fit items-center gap-3 text-base font-bold">
          <Marca tamanho={32} />
          <span>Planoteca</span>
        </Link>

        <div className="mt-auto max-w-[440px]">
          {/* Parágrafo, não `h1`: o título desta página é "Entrar". Um
              segundo `h1` duplicaria o topo da árvore de cabeçalhos. */}
          <p className="mb-3 text-xs tracking-wide uppercase opacity-75">
            De professor para professor
          </p>
          <p className="text-2xl leading-snug">
            Entrar serve para escrever no blog e cuidar do acervo.
          </p>
          <p className="mt-4 opacity-80">
            Para baixar um plano você não precisa de conta — a Biblioteca é aberta.
          </p>
        </div>
      </aside>

      <main className="flex flex-col justify-center gap-6 px-6 py-10 md:px-12">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl">{modo === 'entrar' ? 'Entrar' : 'Criar conta'}</h1>
          <p className="text-muted-foreground">
            {modo === 'entrar'
              ? 'Use sua conta Google ou seu e-mail.'
              : 'Depois de criar, seu acesso nasce como professor.'}
          </p>
        </div>

        {!disponivel ? (
          <p role="alert" className="border-2 border-traco bg-warn-bg px-4 py-3 text-warn">
            O login não está configurado neste ambiente. Preencha as variáveis
            <code className="mx-1">VITE_FIREBASE_*</code> para habilitá-lo. A Biblioteca continua
            funcionando sem ele.
          </p>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={enviando || carregando}
              onClick={() => tentar(entrarComGoogle)}
              className="min-h-12 gap-2 rounded-none border-2 text-[15px] font-bold"
            >
              <GoogleLogo size={18} weight="bold" aria-hidden />
              Continuar com o Google
            </Button>

            <div className="flex items-center gap-3">
              <span className="h-px grow bg-traco-suave" />
              <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                ou
              </span>
              <span className="h-px grow bg-traco-suave" />
            </div>

            <form
              className="flex flex-col gap-3"
              noValidate
              onSubmit={(evento) => {
                evento.preventDefault()
                void tentar(() =>
                  modo === 'entrar'
                    ? entrarComSenha(email, senha)
                    : cadastrarComSenha(nome, email, senha),
                )
              }}
            >
              {modo === 'cadastrar' && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(evento) => setNome(evento.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(evento) => setSenha(evento.target.value)}
                  autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                  required
                />
              </div>

              {erro && (
                <p role="alert" className="border-2 border-traco bg-err-bg px-4 py-2.5 text-err">
                  {erro}
                </p>
              )}

              <Button
                type="submit"
                disabled={enviando || carregando}
                className="min-h-12 rounded-none border-2 border-traco bg-acao text-[15px] font-bold text-acao-texto hover:bg-acao-hover"
              >
                {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
              </Button>
            </form>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setModo(modo === 'entrar' ? 'cadastrar' : 'entrar')
                setErro('')
              }}
              className="w-fit rounded-none px-0 underline underline-offset-4"
            >
              {modo === 'entrar' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
            </Button>
          </>
        )}

        {/* A saída para quem chegou aqui sem precisar. */}
        <Link
          to="/biblioteca"
          className="mt-2 w-fit text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Ver a Biblioteca sem entrar
        </Link>
      </main>
    </div>
  )
}

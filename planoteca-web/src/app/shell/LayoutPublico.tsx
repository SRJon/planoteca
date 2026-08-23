import { Moon } from '@phosphor-icons/react/dist/csr/Moon'
import { Sun } from '@phosphor-icons/react/dist/csr/Sun'
import { NavLink, Link, Outlet } from 'react-router'
import { Marca } from '@/components/marca'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/cn'
import { useAutenticacao } from '../providers/AutenticacaoProvider'
import { useTema } from '../providers/TemaProvider'

/**
 * As três áreas do acervo, na ordem em que o produto as descreve.
 *
 * Mora aqui e não em `permissoes.ts` de propósito: aquele arquivo é o menu
 * da ÁREA LOGADA, filtrado por grupo do diretório. Esta navegação não filtra
 * nada — é a mesma para visitante, professor e administrador, porque
 * consumir o acervo não depende de quem você é.
 */
const AREAS = [
  { rota: '/', titulo: 'Início' },
  { rota: '/biblioteca', titulo: 'Biblioteca' },
  { rota: '/blog', titulo: 'Blog' },
]

/**
 * A casca das telas públicas: barra superior com as três áreas e o acesso à
 * conta, e o conteúdo da rota abaixo.
 *
 * ── Por que não é o `Shell` ─────────────────────────────────────────────
 *
 * O `Shell` é o esqueleto da área de trabalho: barra lateral recolhível,
 * trilha de navegação, menu filtrado por grupo e um menu de conta que
 * pressupõe sessão (`BarraSuperior` desenha avatar e "Sair" sem checar
 * `sessao`). Nada disso serve a quem chega pelo celular para baixar um PDF.
 *
 * Fundir os dois num componente só custaria um condicional por peça —
 * escondo a lateral, troco o avatar por "Entrar", suprimo a trilha — e o
 * resultado seria um componente servindo a dois desenhos que não se parecem.
 * São duas cascas porque são dois produtos: o acervo aberto e a mesa de
 * trabalho de quem o mantém.
 */
export function LayoutPublico() {
  const { sessao } = useAutenticacao()
  // O tema precisa ser trocável AQUI, e não só no painel.
  //
  // O botão existia apenas dentro do menu de conta da `BarraSuperior` — que
  // nem aparece para quem não entrou. Como o tema inicial segue o sistema
  // operacional, quem usa o Windows no escuro abria a Biblioteca no escuro
  // sem nenhuma forma de mudar. O acervo é a parte pública: é justamente
  // onde a saída não pode faltar.
  const { tema, alternarTema } = useTema()

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b-2 border-traco bg-card">
        <div className="mx-auto flex h-[60px] w-full max-w-[1180px] items-center gap-6 px-6 max-md:px-4">
          <Link
            to="/"
            className="flex flex-none items-center gap-2 text-foreground"
            aria-label="Planoteca, ir para o início"
          >
            <Marca tamanho={24} tom="cor" />
            <span className="text-base font-bold tracking-tight max-sm:sr-only">Planoteca</span>
          </Link>

          <nav aria-label="Áreas do acervo" className="min-w-0 flex-1">
            <ul className="flex items-center gap-1">
              {AREAS.map((area) => (
                <li key={area.rota}>
                  <NavLink
                    to={area.rota}
                    // `end` só na raiz: sem isto "Início" ficaria marcado em
                    // toda rota, porque `/` é prefixo de todas.
                    end={area.rota === '/'}
                    className={({ isActive }) =>
                      cn(
                        'block px-3 py-1.5 text-sm hover:bg-secondary hover:text-foreground',
                        isActive
                          ? 'bg-secondary font-bold text-foreground'
                          : 'text-muted-foreground',
                      )
                    }
                  >
                    {area.titulo}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <Button
            variant="ghost"
            size="icon"
            onClick={alternarTema}
            aria-label={tema === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
            className="size-9 flex-none rounded-none text-muted-foreground hover:text-foreground"
          >
            {tema === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          {/* Quem já entrou vai para a mesa de trabalho; quem não entrou vê
              o convite. O botão nunca é barreira para o acervo — ele é a
              porta de quem ESCREVE. */}
          {sessao === null ? (
            <Link
              to="/entrar"
              className="flex-none border-2 border-traco bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Entrar
            </Link>
          ) : (
            <Link
              to="/biblioteca"
              className="flex-none border-2 border-traco px-4 py-1.5 text-sm font-bold text-foreground hover:bg-secondary"
            >
              Minha área
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-6 py-8 max-md:px-4">
        <Outlet />
      </main>

      <footer className="border-t-2 border-traco bg-card">
        <div className="mx-auto w-full max-w-[1180px] px-6 py-6 text-sm text-muted-foreground max-md:px-4">
          Planoteca — acervo de planos de aula com metodologias ativas. De professor para
          professor.
        </div>
      </footer>
    </div>
  )
}

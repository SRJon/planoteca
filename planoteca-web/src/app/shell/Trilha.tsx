import { Link, useLocation } from 'react-router'
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight'
import { cn } from '@/shared/lib/cn'

/** Rótulo do primeiro segmento de rota. Um segmento sem entrada aqui cai no
 * próprio slug capitalizado, o mesmo comportamento de fallback do
 * protótipo. */
const SECAO: Record<string, string> = { admin: 'Área de trabalho', pessoas: 'Pessoas' }

function capitalizar(slug: string): string {
  return slug.length === 0 ? slug : slug[0]!.toUpperCase() + slug.slice(1)
}

/**
 * A trilha, derivada da rota atual.
 *
 * Porta a estrutura de `prototipo-de-origem/src/components/layout/Breadcrumb.tsx`
 * sem o menu de irmãos — com uma única rota real no sistema, "trocar de
 * irmão" não tem o que listar ainda.
 *
 * A trilha só existe dentro do `Shell` (a área logada). `biblioteca` saiu do
 * mapa `SECAO` porque a rota migrou para a casca pública, que não tem
 * trilha. O link "Início" abaixo aponta para `/`, que desde a criação da
 * landing é uma página de verdade — antes era um link para lugar nenhum,
 * resolvido pelo curinga.
 */
export function Trilha() {
  const { pathname } = useLocation()
  const partes = pathname.split('/').filter(Boolean)
  if (partes.length === 0) return null

  const secao = partes[0]!
  const rotuloSecao = SECAO[secao] ?? capitalizar(secao)
  const folha = partes[1]

  const linkClasses = 'px-1 py-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground'

  return (
    <nav
      className="col-start-2 col-end-3 row-start-2 row-end-3 border-b border-traco-suave bg-painel px-6 py-3 text-xs max-md:col-start-1 max-md:col-end-2 max-md:px-4"
      aria-label="Trilha de navegação"
    >
      <ol className="flex flex-wrap items-center gap-0.5">
        <li className="flex items-center gap-0.5">
          <Link to="/" className={linkClasses}>
            Início
          </Link>
        </li>
        <li className="flex items-center gap-0.5">
          <Separador />
          {folha ? (
            <Link to={`/${secao}`} className={linkClasses}>
              {rotuloSecao}
            </Link>
          ) : (
            <span className="px-1 py-0.5 font-semibold text-primary" aria-current="page">
              {rotuloSecao}
            </span>
          )}
        </li>
        {folha && (
          <li className="flex items-center gap-0.5">
            <Separador />
            <span className="px-1 py-0.5 font-semibold text-primary" aria-current="page">
              {folha}
            </span>
          </li>
        )}
      </ol>
    </nav>
  )
}

function Separador() {
  return (
    <span className={cn('inline-flex px-0.5 text-muted-foreground')} aria-hidden>
      <CaretRight size={12} />
    </span>
  )
}

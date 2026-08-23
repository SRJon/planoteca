import { NavLink } from 'react-router'
import { SidebarSimple } from '@phosphor-icons/react/dist/csr/SidebarSimple'
import { Button } from '@/components/ui/button'
import { Marca } from '@/components/marca'
import { cn } from '@/shared/lib/cn'
import type { ItemMenu } from './permissoes'

interface BarraLateralProps {
  recolhida: boolean
  aoAlternar: () => void
  /** No mobile a barra é uma GAVETA sobreposta, não uma coluna da grade:
   * abaixo de 768px os 248px dela não cabem ao lado do conteúdo — a tela de
   * origem (`design/DirecaoB.dc.html`) é um mockup de 390px, e ali a
   * navegação vive atrás de um botão no cabeçalho. */
  abertaNoMobile: boolean
  aoFecharNoMobile: () => void
  /** Os itens já filtrados por `filtrarMenu` — a barra lateral desenha o
   * que recebe e não decide nada sobre permissão. */
  itensMenu: ItemMenu[]
}

/**
 * Barra lateral: marca e o menu de topo.
 *
 * Sem a animação de troca de ícone no botão recolhido (ver histórico de
 * `BarraLateral.module.css`).
 */
export function BarraLateral({
  recolhida,
  aoAlternar,
  itensMenu,
  abertaNoMobile,
  aoFecharNoMobile,
}: BarraLateralProps) {
  return (
    <>
      {/* O véu só existe no mobile, e só com a gaveta aberta. Fechar ao
          tocar fora é o gesto que qualquer pessoa tenta primeiro. */}
      {abertaNoMobile && (
        <Button
          variant="ghost"
          aria-label="Fechar menu"
          onClick={aoFecharNoMobile}
          className="fixed inset-0 z-(--camada-veu) size-auto rounded-none bg-overlay hover:bg-overlay md:hidden"
        />
      )}
      <nav
        className={cn(
          'col-start-1 col-end-2 row-start-1 row-end-4 flex min-h-0 flex-col border-r border-side-linha bg-side-bg px-3 pb-3 text-side-ink',
          // Abaixo de 768px a barra sai da grade e vira gaveta fixa. O
          // `translate` fora da tela (em vez de `hidden`) preserva o foco e
          // deixa a transição existir para quem não pediu movimento reduzido.
          'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-(--camada-dialogo) max-md:w-[248px] max-md:transition-transform',
          abertaNoMobile ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
        )}
        aria-label="Navegação principal"
      >
      <div
        className={cn(
          'mt-3 flex h-[60px] flex-none items-center gap-3 px-2',
          recolhida && 'justify-center px-0',
        )}
      >
        {recolhida ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Expandir menu"
            className="mx-auto text-side-ink hover:bg-side-bg-2 hover:text-side-ink"
            onClick={aoAlternar}
          >
            <SidebarSimple size={20} />
          </Button>
        ) : (
          <>
            <span className="inline-flex flex-none text-side-marca" aria-hidden>
              <Marca tamanho={26} />
            </span>
            <span className="overflow-hidden font-bold whitespace-nowrap">Planoteca</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Recolher menu"
              className="ml-auto text-side-ink-2 hover:bg-side-bg-2 hover:text-side-ink"
              onClick={aoAlternar}
            >
              <SidebarSimple size={18} />
            </Button>
          </>
        )}
      </div>

      <ul className="-mx-2 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2">
        {itensMenu.map((item) => (
          <li key={item.rota}>
            <NavLink
              to={item.rota}
              className={({ isActive }) =>
                cn(
                  'relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-side-ink-2 hover:bg-side-bg-2 hover:text-side-ink',
                  recolhida && 'justify-center gap-0 px-0',
                  isActive &&
                    "bg-side-ativo-bg font-semibold text-side-ativo-ink before:absolute before:inset-y-[9px] before:left-0 before:w-[3px] before:rounded-r before:bg-side-marca before:content-['']",
                )
              }
              onClick={aoFecharNoMobile}
              title={recolhida ? item.titulo : undefined}
            >
              {({ isActive }) => (
                <>
                  {/* O ícone vem do item (`permissoes.ts`), não daqui: era
                      fixo, e todo item herdava o mesmo desenho. Com a barra
                      recolhida ele é a ÚNICA coisa visível, então um ícone
                      genérico tornaria o menu ilegível nesse modo. */}
                  <span
                    className={cn(
                      'inline-flex w-5 flex-none justify-center text-side-ic',
                      isActive && 'text-side-marca',
                    )}
                    aria-hidden
                  >
                    <item.icone size={18} />
                  </span>
                  {!recolhida && item.titulo}
                </>
              )}
            </NavLink>
          </li>
        ))}
        </ul>
      </nav>
    </>
  )
}

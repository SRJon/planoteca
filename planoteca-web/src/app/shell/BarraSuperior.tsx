import { List } from '@phosphor-icons/react/dist/csr/List'
import { Sun } from '@phosphor-icons/react/dist/csr/Sun'
import { Moon } from '@phosphor-icons/react/dist/csr/Moon'
import { SignOut } from '@phosphor-icons/react/dist/csr/SignOut'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/cn'
import { useAutenticacao } from '../providers/AutenticacaoProvider'
import { useTema } from '../providers/TemaProvider'

/** Iniciais para o avatar — primeira letra do primeiro e do último nome.
 * `charAt` em vez de indexação (`nome[0]`): com `noUncheckedIndexedAccess`
 * ligado, indexar um array possivelmente vazio devolveria `string |
 * undefined`; `charAt` sempre devolve `string` (vazia se fora do intervalo). */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  const primeira = partes[0]?.charAt(0) ?? ''
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.charAt(0) ?? '') : ''
  const junto = (primeira + ultima).toUpperCase()
  return junto === '' ? '?' : junto
}

/** O nome de exibição vem de `GET /auth/me`, que é a pessoa como a Planoteca
 * a conhece — não do token do Firebase. Nunca fica vazio: o back-end usa a
 * parte antes do @ quando o provedor não informa nome. */
function nomeExibicao(nome: string | undefined): string {
  return nome?.trim() ? nome : 'Usuário'
}

function Avatar({ texto, className }: { texto: string; className?: string }) {
  return (
    <span
      className={cn(
        'grid size-8 flex-none place-items-center rounded-full bg-brand-subtle text-xs font-bold text-brand-d',
        className,
      )}
      aria-hidden
    >
      {texto}
    </span>
  )
}

/**
 * Barra superior: só o menu da conta, por ora.
 *
 * Porta o essencial de `prototipo-de-origem/src/components/layout/Topbar.tsx` —
 * sem o slot de título por portal e sem o sino de avisos, os dois fora do
 * escopo desta tarefa.
 */
export function BarraSuperior({ aoAbrirMenu }: { aoAbrirMenu: () => void }) {
  const { sessao, sair } = useAutenticacao()
  // O tema é do `TemaProvider`, que persiste a escolha e é o único a escrever
  // a classe `.dark`. Este componente escrevia o estado direto no DOM, e a
  // escolha se perdia na recarga e na próxima mudança de tema do sistema.
  const { tema, alternarTema } = useTema()
  const nome = nomeExibicao(sessao?.nome)

  return (
    // Sem raio, sem margem e sem sombra: na direção B as faixas do shell
    // são coladas e separadas por TRAÇO, não cartões flutuando sobre um
    // fundo. O traço de 2px embaixo fecha o topo contra a trilha.
    <header className="col-start-2 col-end-3 row-start-1 row-end-2 flex h-[60px] min-w-0 items-center gap-3 border-b-2 border-traco bg-card px-6 max-md:col-start-1 max-md:col-end-2 max-md:px-4">
      {/* O botão da gaveta só existe no mobile: no desktop a barra lateral
          está sempre visível, e um segundo controle para ela seria ruído. */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Abrir menu"
        onClick={aoAbrirMenu}
        className="-ml-1 size-11 rounded-none md:hidden"
      >
        <List size={20} />
      </Button>
      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sua conta"
            className="rounded-full p-0 hover:bg-transparent hover:[&_span]:bg-primary hover:[&_span]:text-primary-foreground"
          >
            <Avatar texto={iniciais(nome)} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center gap-3 px-1.5 py-2">
            <Avatar texto={iniciais(nome)} className="size-9 text-sm" />
            <span className="min-w-0 truncate text-sm font-bold">{nome}</span>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={alternarTema}>
            {tema === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span className="flex flex-col">
              <span>Trocar o tema</span>
              <span className="text-xs text-muted-foreground">
                {tema === 'dark' ? 'Está no escuro' : 'Está no claro'}
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void sair()}>
            <SignOut size={15} />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

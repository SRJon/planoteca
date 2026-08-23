import { PersonArmsSpread } from '@phosphor-icons/react/dist/csr/PersonArmsSpread'
import { ESCALAS, useAcessibilidade } from '@/shared/acessibilidade'
import type { Escala } from '@/shared/acessibilidade'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/shared/lib/cn'

/** O rótulo de cada degrau, na ordem de `ESCALAS`. */
const ROTULO_ESCALA: Record<Escala, string> = {
  1: 'Padrão',
  1.15: 'Maior',
  1.3: 'Grande',
  1.5: 'Muito grande',
}

/**
 * Uma chave liga/desliga.
 *
 * `role="switch"` e não caixa de seleção: o estado é ligado ou desligado
 * agora, não "marcado para enviar depois". O leitor de tela anuncia
 * "ligado/desligado" em vez de "marcado", que é o que descreve o efeito
 * imediato destes controles.
 */
function Chave({
  rotulo,
  descricao,
  ligado,
  aoAlternar,
}: {
  rotulo: string
  descricao: string
  ligado: boolean
  aoAlternar: () => void
}) {
  return (
    <Button
      variant="ghost"
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={aoAlternar}
      className="h-auto w-full justify-start gap-3 rounded-none px-2 py-2 text-left font-normal whitespace-normal"
    >
      {/* O trilho e o cursor têm contraste entre si nos DOIS estados: ligado
          é cursor claro sobre índigo, desligado é cursor escuro sobre papel.
          Um cursor de cor única desapareceria num dos dois. */}
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex h-5 w-9 flex-none items-center border-2 border-traco p-[2px] transition-colors',
          ligado ? 'bg-primary' : 'bg-background',
        )}
      >
        <span
          className={cn(
            'block size-3 transition-transform',
            ligado ? 'translate-x-4 bg-primary-foreground' : 'bg-traco',
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold">{rotulo}</span>
        <span className="block text-xs text-muted-foreground">{descricao}</span>
      </span>
    </Button>
  )
}

/**
 * O menu de acessibilidade da barra pública.
 *
 * ── Por que um menu, e não uma página de configurações ──────────────────
 *
 * Quem precisa aumentar a fonte precisa disso ANTES de conseguir ler o
 * caminho até uma página de ajustes. Um menu na barra resolve no lugar onde
 * o problema aparece, sem exigir leitura prévia.
 *
 * ── Por que fica ao lado do botão de tema ──────────────────────────────
 *
 * São a mesma classe de coisa: preferência de leitura, guardada no
 * navegador, válida com ou sem conta. Separá-las mandaria metade das
 * preferências para o menu de conta, que nem aparece para visitante.
 */
export function MenuAcessibilidade() {
  const { preferencias, definir, restaurarPadrao, alterado } = useAcessibilidade()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Acessibilidade e tamanho do texto"
          className="relative size-9 flex-none rounded-none text-muted-foreground hover:text-foreground"
        >
          <PersonArmsSpread size={18} />
          {/* O ponto avisa que há preferência ativa. Sem ele, quem trocou de
              computador não descobre por que a tela está diferente do que
              lembra — e o menu é o único lugar onde isso se desfaz. */}
          {alterado && (
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 size-1.5 bg-acao"
            />
          )}
        </Button>
      </DropdownMenuTrigger>

      {/* O painel do shadcn nasce com `rounded-lg`, `shadow-md` e `ring-1`.
          A direção B desenha com traço, não com sombra, e o raio é zero —
          ver o cabeçalho de `tema.css`. */}
      <DropdownMenuContent
        align="end"
        className="w-72 rounded-none border-2 border-traco p-0 shadow-none ring-0"
      >
        <div className="border-b-2 border-traco px-3 py-2.5">
          <p className="text-sm font-bold">Leitura</p>
          <p className="text-xs text-muted-foreground">
            Fica guardado neste navegador, com ou sem conta.
          </p>
        </div>

        <fieldset className="border-b-2 border-traco px-3 py-3">
          <legend className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Tamanho do texto
          </legend>
          {/* Botões de rádio, e não um controle deslizante: são quatro degraus
              fechados, e o deslizante exigiria mira fina justamente de quem
              tem dificuldade motora ou visual. */}
          <div className="flex gap-1" role="radiogroup" aria-label="Tamanho do texto">
            {ESCALAS.map((escala) => {
              const ativo = preferencias.escala === escala
              return (
                <Button
                  key={escala}
                  variant="ghost"
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => definir('escala', escala)}
                  className={cn(
                    'h-auto flex-1 rounded-none border-2 border-traco py-1.5 text-sm',
                    ativo ? 'bg-primary font-bold text-primary-foreground' : 'bg-card',
                  )}
                >
                  {/* O "A" cresce junto com o degrau que representa: a pista
                      visual é a própria coisa que o controle faz. */}
                  <span aria-hidden style={{ fontSize: `${escala * 0.85}rem` }}>
                    A
                  </span>
                  <span className="sr-only">{ROTULO_ESCALA[escala]}</span>
                </Button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {ROTULO_ESCALA[preferencias.escala]}
            {preferencias.escala !== 1 && ` · ${Math.round(preferencias.escala * 100)}%`}
          </p>
        </fieldset>

        <div className="py-1">
          <Chave
            rotulo="Alto contraste"
            descricao="Preto e branco, traço reforçado"
            ligado={preferencias.altoContraste}
            aoAlternar={() => definir('altoContraste', !preferencias.altoContraste)}
          />
          <Chave
            rotulo="Menos movimento"
            descricao="Sem transição nem animação"
            ligado={preferencias.menosMovimento}
            aoAlternar={() => definir('menosMovimento', !preferencias.menosMovimento)}
          />
          <Chave
            rotulo="Sublinhar links"
            descricao="No corpo do texto, sempre"
            ligado={preferencias.sublinharLinks}
            aoAlternar={() => definir('sublinharLinks', !preferencias.sublinharLinks)}
          />
        </div>

        {alterado && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <Button
              variant="ghost"
              type="button"
              onClick={restaurarPadrao}
              className="h-auto w-full justify-start rounded-none px-3 py-2.5 text-sm font-bold"
            >
              Voltar ao padrão
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

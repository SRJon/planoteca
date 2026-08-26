import { useId, useState } from 'react'
import { Link } from 'react-router'
import type { Componente } from '@/entities/vocabulario'
import { classeCorComponente } from '@/entities/vocabulario'
import { Button } from '@/components/ui/button'

/**
 * O card de uma área do conhecimento, com os componentes filhos escondidos
 * até a pessoa pedir.
 *
 * ── Por que três gatilhos e não um ───────────────────────────────────────
 *
 * O mesmo card precisa abrir de três formas, e nenhuma delas cobre as
 * outras. `group-hover:` só dispara em aparelho que tem cursor — no celular
 * o Tailwind nunca aplica a variante. `group-focus-within:` cobre quem chega
 * por teclado. E o estado `aberto`, escrito pelo cabeçalho, cobre o toque,
 * que não é nem hover nem foco persistente.
 *
 * O cabeçalho é `<button aria-expanded>` porque essa é a semântica real do
 * que ele faz — revelar conteúdo próprio. Um link não serviria: não há para
 * onde navegar, e a área inteira não é um recorte que a Biblioteca aceite
 * (o filtro dela é por componente, um id por vez).
 *
 * ── Por que a lista SOBREPÕE em vez de crescer em linha ──────────────────
 *
 * Crescer em linha empurraria as outras três colunas para a altura do card
 * mais alto, e as áreas têm de um a quatro componentes — a linha inteira
 * ganharia o vão da maior, sempre vazio nas outras. Sobrepor com `absolute`
 * mantém as quatro do mesmo tamanho fechadas e não mexe em vizinho nenhum
 * ao abrir. No celular, onde a grade é de uma coluna só, o custo do empurrão
 * não existe: lá a lista entra no fluxo.
 */
export function CardArea({ area, componentes }: { area: string; componentes: Componente[] }) {
  const [aberto, definirAberto] = useState(false)
  const idLista = useId()
  const cor = classeCorComponente(componentes[0])

  return (
    <div className="group relative flex h-full flex-col border-2 border-traco bg-card">
      {/* A faixa de topo é a cor da área — o mesmo token que pinta o bloco
          de sigla na ficha da Biblioteca. Cor como identificação, nunca como
          fundo do card: um card inteiro tingido apagaria o traço que
          estrutura a direção. */}
      <div aria-hidden className={`h-2 shrink-0 ${cor}`} />

      {/* `variant="ghost"`, e não a padrão: a padrão pinta o texto com a
          cor do botão primário, e o nome da área sumia em branco sobre o
          card branco. A `ghost` não impõe cor — o cabeçalho herda a tinta
          do card. */}
      <Button
        type="button"
        variant="ghost"
        aria-expanded={aberto}
        aria-controls={idLista}
        onClick={() => definirAberto((atual) => !atual)}
        className="flex h-auto w-full flex-col items-start gap-1.5 rounded-none px-[13px] py-3 text-left whitespace-normal text-foreground hover:bg-secondary aria-expanded:bg-secondary"
      >
        {/* `whitespace-normal` AQUI, no filho, e não só no `Button`: o
            `whitespace-nowrap` da base do botão vencia e o nome de duas
            linhas transbordava para o card vizinho. */}
        <span className="font-display text-base leading-[1.2] font-bold whitespace-normal">
          {area}
        </span>
        <span className="font-mono text-[11px] tracking-[0.06em] text-muted-foreground">
          {componentes.length} {componentes.length === 1 ? 'componente' : 'componentes'}
        </span>
      </Button>

      <ul
        id={idLista}
        className={`flex flex-col border-t-2 border-traco bg-card transition-[opacity,translate] duration-120 max-md:static max-md:translate-y-0 md:absolute md:top-full md:right-[-2px] md:left-[-2px] md:z-[var(--camada-base)] md:border-2 ${
          aberto
            ? 'opacity-100'
            : 'max-md:hidden md:invisible md:-translate-y-1 md:opacity-0 md:group-focus-within:visible md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:visible md:group-hover:translate-y-0 md:group-hover:opacity-100'
        }`}
      >
        {componentes.map((componente) => (
          <li key={componente.id} className="border-b-2 border-traco last:border-b-0">
            <Link
              to={`/biblioteca?componente=${componente.id}`}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-secondary"
            >
              {/* O mesmo bloco de sigla de `FichaPlano`: quadrado chapado na
                  cor da área, duas letras em display. `aria-hidden` porque o
                  nome por extenso vem ao lado. */}
              <span
                aria-hidden
                className={`grid size-7 flex-none place-items-center font-display text-xs font-bold text-comp-texto ${classeCorComponente(componente)}`}
              >
                {componente.sigla}
              </span>
              <span className="text-sm">{componente.nome}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

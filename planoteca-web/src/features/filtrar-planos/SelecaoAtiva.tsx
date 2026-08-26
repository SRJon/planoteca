import { X } from '@phosphor-icons/react/dist/csr/X'
import type { Vocabulario } from '@/entities/vocabulario'
import { Button } from '@/components/ui/button'

interface SelecaoAtivaProps {
  vocabulario: Vocabulario
  componentesIds: string[]
  seriesIds: string[]
  metodologiasIds: string[]
  aoAlternarComponente: (id: string) => void
  aoAlternarSerie: (id: string) => void
  aoAlternarMetodologia: (id: string) => void
  aoLimpar: () => void
}

/** Uma pílula: o rótulo do item e o ✕ que o remove. */
function Pilula({ rotulo, aoRemover }: { rotulo: string; aoRemover: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={aoRemover}
      // O rótulo acessível diz a AÇÃO, e não só o nome: sem ele, um leitor
      // de tela anunciaria três botões chamados "Matemática", "9º ano" e
      // "Estudo de Casos", sem dizer que tocá-los REMOVE o recorte.
      aria-label={`Remover ${rotulo}`}
      className="min-h-11 gap-1.5 rounded-none border-2 border-traco bg-card px-2.5 text-[12.5px] font-semibold"
    >
      {rotulo}
      <X size={12} weight="bold" aria-hidden="true" />
    </Button>
  )
}

/**
 * A seleção atual, acima da lista de planos.
 *
 * **Por que ela existe, já que a coluna mostra o mesmo.** No celular a
 * coluna vira gaveta, e com a gaveta fechada nada na tela diria o que está
 * recortado. As pílulas são a única leitura da seleção nessa largura. No
 * desktop elas continuam, e passam a ser o caminho curto de desfazer um
 * item sem procurá-lo na lista.
 *
 * **Por que a série usa `rotuloCompleto`.** Na régua, "9º" está cercado de
 * outras siglas e o contexto o resolve. Numa pílula solta ao lado de
 * "Matemática", "9º" não diz de que etapa é.
 *
 * Um id que não casa com nenhum item do vocabulário simplesmente não vira
 * pílula. É o caso do link antigo com um componente já removido: o recorte
 * segue aplicado, e a tela não desenha uma pílula sem nome.
 */
export function SelecaoAtiva({
  vocabulario,
  componentesIds,
  seriesIds,
  metodologiasIds,
  aoAlternarComponente,
  aoAlternarSerie,
  aoAlternarMetodologia,
  aoLimpar,
}: SelecaoAtivaProps) {
  const componentes = vocabulario.componentes.filter((c) => componentesIds.includes(c.id))
  const series = vocabulario.series.filter((s) => seriesIds.includes(s.id))
  const metodologias = vocabulario.metodologias.filter((m) => metodologiasIds.includes(m.id))

  if (componentes.length + series.length + metodologias.length === 0) return null

  return (
    /* `aria-live="polite"`: as pílulas mudam por causa de um toque em OUTRO
       elemento — uma caixa da coluna, uma célula da régua — e o foco fica
       lá. Sem isto, quem usa leitor de tela não saberia que a seleção
       mudou. */
    <div aria-live="polite" aria-label="Filtros ativos" className="flex flex-wrap items-center gap-1.5">
      {series.map((serie) => (
        <Pilula
          key={serie.id}
          rotulo={serie.rotuloCompleto}
          aoRemover={() => aoAlternarSerie(serie.id)}
        />
      ))}
      {componentes.map((componente) => (
        <Pilula
          key={componente.id}
          rotulo={componente.nome}
          aoRemover={() => aoAlternarComponente(componente.id)}
        />
      ))}
      {metodologias.map((metodologia) => (
        <Pilula
          key={metodologia.id}
          rotulo={metodologia.nome}
          aoRemover={() => aoAlternarMetodologia(metodologia.id)}
        />
      ))}
      <Button
        type="button"
        variant="ghost"
        onClick={aoLimpar}
        className="min-h-11 rounded-none px-2 text-[12.5px] font-bold text-accent hover:bg-transparent hover:text-accent hover:underline"
      >
        Limpar filtros
      </Button>
    </div>
  )
}

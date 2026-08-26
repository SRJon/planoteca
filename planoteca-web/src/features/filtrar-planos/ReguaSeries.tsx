import type { Serie } from '@/entities/vocabulario'
import { Chip } from '@/components/ui/chip'
import { EtiquetaGrupo } from './EtiquetaGrupo'

interface ReguaSeriesProps {
  series: Serie[]
  /** Multisseleção: uma célula fica ativa quando o id consta na lista. */
  selecionadas: string[]
  aoAlternar: (id: string) => void
}

/**
 * A régua de série — a assinatura da direção B, mantida da coluna antiga.
 *
 * Série continua RÉGUA e não lista com caixa de marcar, ao contrário de
 * componente e metodologia. A razão é o número: as séries da educação
 * básica são sete e não crescem, então cabem todas numa faixa de células
 * iguais. Componente e metodologia crescem por cadastro, e por isso viraram
 * lista com contagem e dobra.
 *
 * As células não têm contagem própria de propósito. Sete números miúdos numa
 * faixa de 272px competiriam com a sigla, que é o que se lê à distância.
 *
 * A grade se ajusta ao conteúdo (`auto-fit`) em vez de fixar colunas: o dia
 * em que a oitava série entrar, ela cabe sem ninguém alterar esta linha.
 */
export function ReguaSeries({ series, selecionadas, aoAlternar }: ReguaSeriesProps) {
  if (series.length === 0) return null

  return (
    /* `fieldset` + `legend`: a régua é um grupo de controles com um rótulo
       comum, e é assim que um leitor de tela anuncia "Série, botão 9º ano
       do Ensino Fundamental, pressionado". Um `div` com um `p` acima leria
       as células sem dizer do que são. */
    <fieldset className="border-0 p-0">
      <legend className="mb-[7px] p-0">
        <EtiquetaGrupo>Série</EtiquetaGrupo>
      </legend>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(48px,1fr))] gap-[3px]">
        {series.map((serie) => (
          <Chip
            key={serie.id}
            ativo={selecionadas.includes(serie.id)}
            onClick={() => aoAlternar(serie.id)}
            // O chip mostra a sigla, que é curta; o nome completo vai no
            // rótulo acessível, porque "2ªEM" não se lê sozinho.
            aria-label={serie.rotuloCompleto}
            className="px-0.5 text-[12px]"
          >
            {serie.sigla}
          </Chip>
        ))}
      </div>
    </fieldset>
  )
}

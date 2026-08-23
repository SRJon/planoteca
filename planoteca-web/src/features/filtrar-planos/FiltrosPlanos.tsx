import { useId } from 'react'
import { X } from '@phosphor-icons/react/dist/csr/X'
import type { Vocabulario } from '@/entities/vocabulario'
import { Button } from '@/components/ui/button'
import { CampoBusca } from '@/components/ui/campo-busca'
import { Chip } from '@/components/ui/chip'

/** O rótulo em mono, caixa alta e espacejado que a direção usa nas seções. */
function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
      {children}
    </span>
  )
}

interface FiltrosPlanosProps {
  pesquisa: string
  aoMudarPesquisa: (texto: string) => void
  /** As listas vêm da API (`GET /api/v1/vocabulary`), não de uma constante:
   * cadastrar um componente novo passa a funcionar sem deploy. */
  vocabulario: Vocabulario
  componenteId: string | null
  aoAlternarComponente: (id: string) => void
  serieId: string | null
  aoAlternarSerie: (id: string) => void
  metodologiaId: string | null
  aoAlternarMetodologia: (id: string) => void
  /** Quantos planos a seleção atual devolve. */
  total: number
  temFiltro: boolean
  aoLimpar: () => void
}

/**
 * O painel de filtro da biblioteca: busca livre, série, componente e
 * metodologia.
 *
 * Puramente controlado — não conhece URL nem debounce, os dois vivem em
 * `useFiltroPlanos`. `pesquisa` aqui é o valor a cada tecla, não o já
 * comprometido na URL, para o campo não atrasar a digitação.
 *
 * A ordem é a da tela de origem (`design/DirecaoB.dc.html`): busca, série,
 * componente, contagem. Série vem antes de componente porque a primeira
 * pergunta de um professor é "para que turma", e só depois "de que matéria"
 * — o recorte mais grosso primeiro. Metodologia entrou por último: é o
 * recorte que só quem já sabe o que procura usa.
 *
 * As grades não têm mais número fixo de colunas. Com o vocabulário vindo do
 * banco, `grid-cols-5` quebraria no dia em que a sétima série entrasse — as
 * colunas passaram a se ajustar ao conteúdo.
 *
 * A faixa de contagem fecha o painel em bloco de tinta. Ela é o retorno
 * imediato de cada toque: sem ela, ligar um chip que não muda o resultado
 * seria indistinguível de um chip que não funcionou.
 */
export function FiltrosPlanos({
  pesquisa,
  aoMudarPesquisa,
  vocabulario,
  componenteId,
  aoAlternarComponente,
  serieId,
  aoAlternarSerie,
  metodologiaId,
  aoAlternarMetodologia,
  total,
  temFiltro,
  aoLimpar,
}: FiltrosPlanosProps) {
  const idBusca = useId()

  // Só as metodologias ativas de fato, e não as 41 do seed: uma grade com
  // técnicas e ferramentas digitais que nenhum plano usa enche a tela de
  // chips que sempre devolvem lista vazia.
  const metodologiasFiltro = vocabulario.metodologias.filter((m) => m.tipo === 'metodologia')

  return (
    <div className="flex flex-col gap-[13px]">
      <div>
        <label htmlFor={idBusca} className="sr-only">
          Buscar por assunto, autoria ou objeto de conhecimento
        </label>
        <CampoBusca
          id={idBusca}
          value={pesquisa}
          onChange={(evento) => aoMudarPesquisa(evento.target.value)}
          placeholder="Assunto, autoria ou objeto de conhecimento"
        />
      </div>

      {/* `fieldset` + `legend`: a grade de chips é um grupo de controles
          com um rótulo comum, e é assim que um leitor de tela anuncia
          "Série, botão 9º ano, pressionado". Um `div` com um `p` acima leria
          os chips sem dizer do que são. */}
      {vocabulario.series.length > 0 && (
        <fieldset className="border-0 p-0">
          <legend className="mb-[7px] p-0">
            <Etiqueta>Série</Etiqueta>
          </legend>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1.5">
            {vocabulario.series.map((serie) => (
              <Chip
                key={serie.id}
                ativo={serieId === serie.id}
                onClick={() => aoAlternarSerie(serie.id)}
                // O chip mostra a sigla, que é curta; o nome completo vai no
                // rótulo acessível, porque "2ªEM" não se lê sozinho.
                aria-label={serie.rotuloCompleto}
              >
                {serie.sigla}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      {vocabulario.componentes.length > 0 && (
        <fieldset className="border-0 p-0">
          <legend className="mb-[7px] p-0">
            <Etiqueta>Componente</Etiqueta>
          </legend>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {vocabulario.componentes.map((componente) => (
              <Chip
                key={componente.id}
                ativo={componenteId === componente.id}
                onClick={() => aoAlternarComponente(componente.id)}
              >
                {componente.nome}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      {metodologiasFiltro.length > 0 && (
        <fieldset className="border-0 p-0">
          <legend className="mb-[7px] p-0">
            <Etiqueta>Metodologia</Etiqueta>
          </legend>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {metodologiasFiltro.map((metodologia) => (
              <Chip
                key={metodologia.id}
                ativo={metodologiaId === metodologia.id}
                onClick={() => aoAlternarMetodologia(metodologia.id)}
              >
                {metodologia.nome}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex items-center justify-between gap-3 bg-foreground px-[13px] py-2.5 text-background">
        {/* `aria-live="polite"`: a contagem muda por causa de um toque em
            OUTRO elemento, e o foco continua no chip — sem isto, quem usa
            leitor de tela não saberia que o resultado mudou. */}
        <span aria-live="polite" className="font-mono text-[12.5px] font-semibold">
          {total} {total === 1 ? 'plano' : 'planos'}
        </span>
        {temFiltro && (
          <Button
            type="button"
            variant="ghost"
            onClick={aoLimpar}
            className="min-h-11 gap-1.5 rounded-none px-2 text-[13px] font-bold text-accent hover:bg-transparent hover:text-accent hover:underline"
          >
            <X size={15} weight="bold" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  )
}

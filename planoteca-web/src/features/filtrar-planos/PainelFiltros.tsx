import { useId } from 'react'
import type { Facetas } from '@/entities/plano'
import type { Vocabulario } from '@/entities/vocabulario'
import { CampoBusca } from '@/components/ui/campo-busca'
import { GrupoFiltro } from './GrupoFiltro'
import { ReguaSeries } from './ReguaSeries'

interface PainelFiltrosProps {
  pesquisa: string
  aoMudarPesquisa: (texto: string) => void
  /** As listas vêm da API (`GET /api/v1/vocabulary`), não de uma constante:
   * cadastrar um componente novo passa a funcionar sem deploy. */
  vocabulario: Vocabulario
  /** As contagens de `GET /api/v1/lesson-plans/facets`. Vazias enquanto a
   * busca está em voo: cada item mostra zero, e nenhum some. */
  facetas: Facetas
  componentesIds: string[]
  aoAlternarComponente: (id: string) => void
  seriesIds: string[]
  aoAlternarSerie: (id: string) => void
  metodologiasIds: string[]
  aoAlternarMetodologia: (id: string) => void
  /** A gaveta do celular passa `false`: lá a busca fica na PÁGINA, atrás do
   * botão "Filtros" e não dentro dele. Dois campos de busca com o mesmo
   * valor dariam a quem usa leitor de tela dois controles indistinguíveis
   * pelo nome. */
  comBusca?: boolean
}

/**
 * O painel de filtro da Biblioteca — a coluna do desktop e o miolo da
 * gaveta do celular.
 *
 * Puramente controlado: não conhece URL nem debounce, os dois vivem em
 * `useFiltroPlanos`. `pesquisa` aqui é o valor a cada tecla, não o já
 * comprometido na URL, para o campo não atrasar a digitação.
 *
 * A ordem é a do desenho aprovado (`design/2026-08-26-filtros-biblioteca-opcoes.html`,
 * opção B): busca, série, componente, metodologia. Série vem antes de
 * componente porque a primeira pergunta de um professor é "para que turma",
 * e só depois "de que matéria" — o recorte mais grosso primeiro.
 * Metodologia entrou por último: é o recorte que só quem já sabe o que
 * procura usa.
 *
 * O painel não tem faixa de contagem, ao contrário do `FiltrosPlanos` que
 * ele substitui. O total agora fica ao lado da LISTA, onde o desenho o
 * colocou: com a coluna à esquerda, uma faixa no pé dela ficaria longe do
 * que ela conta.
 */
export function PainelFiltros({
  pesquisa,
  aoMudarPesquisa,
  vocabulario,
  facetas,
  componentesIds,
  aoAlternarComponente,
  seriesIds,
  aoAlternarSerie,
  metodologiasIds,
  aoAlternarMetodologia,
  comBusca = true,
}: PainelFiltrosProps) {
  const idBusca = useId()

  // Só as metodologias ativas de fato, e não as 41 do seed: uma lista com
  // técnicas e ferramentas digitais que nenhum plano usa enche a coluna de
  // itens que sempre devolvem lista vazia.
  const metodologiasFiltro = vocabulario.metodologias.filter((m) => m.tipo === 'metodologia')

  return (
    <div className="flex flex-col gap-[13px]">
      {comBusca && (
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
      )}

      <ReguaSeries
        series={vocabulario.series}
        selecionadas={seriesIds}
        aoAlternar={aoAlternarSerie}
      />

      <GrupoFiltro
        titulo="Componente"
        comSigla
        itens={vocabulario.componentes}
        selecionados={componentesIds}
        contagens={facetas.componentes}
        aoAlternar={aoAlternarComponente}
      />

      <GrupoFiltro
        titulo="Metodologia"
        itens={metodologiasFiltro}
        selecionados={metodologiasIds}
        contagens={facetas.metodologias}
        aoAlternar={aoAlternarMetodologia}
      />
    </div>
  )
}

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FACETAS_VAZIAS } from '@/entities/plano'
import { VOCABULARIO_FIXTURE } from '@/teste/planos'
import { PainelFiltros } from './PainelFiltros'

function renderizar(sobrepor: Partial<React.ComponentProps<typeof PainelFiltros>> = {}) {
  render(
    <PainelFiltros
      pesquisa=""
      aoMudarPesquisa={() => {}}
      vocabulario={VOCABULARIO_FIXTURE}
      facetas={FACETAS_VAZIAS}
      componentesIds={[]}
      aoAlternarComponente={() => {}}
      seriesIds={[]}
      aoAlternarSerie={() => {}}
      metodologiasIds={[]}
      aoAlternarMetodologia={() => {}}
      {...sobrepor}
    />,
  )
}

describe('PainelFiltros', () => {
  it('compõe busca, régua de série e os dois grupos', () => {
    renderizar()

    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '6º ano do Ensino Fundamental' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Matemática/ })).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: /Rotação por Estações de Aprendizagem/ }),
    ).toBeInTheDocument()
  })

  it('com comBusca falso, a gaveta não repete o campo de busca', () => {
    renderizar({ comBusca: false })

    // A busca fica na PÁGINA no celular (RF-09). Dois campos de busca com o
    // mesmo valor dariam a quem usa leitor de tela dois controles
    // indistinguíveis pelo nome.
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Matemática/ })).toBeInTheDocument()
  })

  it('o filtro de metodologia não oferece ferramenta digital', () => {
    renderizar()

    // "Kahoot" é `tipo: 'ferramenta'` na fixture. A coluna só lista o que é
    // metodologia de fato — as 41 do seed encheriam a lista de itens que
    // nenhum plano usa.
    expect(screen.queryByRole('checkbox', { name: /Kahoot/ })).not.toBeInTheDocument()
  })

  it('a contagem de cada item vem das facetas', () => {
    const matematica = VOCABULARIO_FIXTURE.componentes[0]!
    renderizar({
      facetas: { ...FACETAS_VAZIAS, componentes: [{ id: matematica.id, total: 7 }] },
    })

    const linha = screen.getByRole('checkbox', { name: /Matemática/ }).closest('label')!
    expect(linha).toHaveTextContent('7')
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VOCABULARIO_FIXTURE } from '@/teste/planos'
import { SelecaoAtiva } from './SelecaoAtiva'

const MATEMATICA = VOCABULARIO_FIXTURE.componentes[0]!
const NONO = VOCABULARIO_FIXTURE.series[3]!
const ESTACOES = VOCABULARIO_FIXTURE.metodologias[0]!

function renderizar(sobrepor: Partial<React.ComponentProps<typeof SelecaoAtiva>> = {}) {
  const props = {
    vocabulario: VOCABULARIO_FIXTURE,
    componentesIds: [MATEMATICA.id],
    seriesIds: [NONO.id],
    metodologiasIds: [ESTACOES.id],
    aoAlternarComponente: vi.fn(),
    aoAlternarSerie: vi.fn(),
    aoAlternarMetodologia: vi.fn(),
    aoLimpar: vi.fn(),
    ...sobrepor,
  }
  render(<SelecaoAtiva {...props} />)
  return props
}

describe('SelecaoAtiva', () => {
  it('desenha uma pílula por item marcado, com o rótulo completo da série', () => {
    renderizar()

    expect(screen.getByRole('button', { name: `Remover ${MATEMATICA.nome}` })).toBeInTheDocument()
    // A série mostra `rotuloCompleto` (RF-08): "9º" fora da régua não se lê.
    expect(screen.getByText(NONO.rotuloCompleto)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Remover ${ESTACOES.nome}` })).toBeInTheDocument()
  })

  it('o ✕ de um componente chama o callback do grupo componente com o id', async () => {
    const usuario = userEvent.setup()
    const props = renderizar()

    await usuario.click(screen.getByRole('button', { name: `Remover ${MATEMATICA.nome}` }))

    expect(props.aoAlternarComponente).toHaveBeenCalledWith(MATEMATICA.id)
    expect(props.aoAlternarSerie).not.toHaveBeenCalled()
    expect(props.aoAlternarMetodologia).not.toHaveBeenCalled()
  })

  it('o ✕ de uma série chama o callback do grupo série com o id', async () => {
    const usuario = userEvent.setup()
    const props = renderizar()

    await usuario.click(screen.getByRole('button', { name: `Remover ${NONO.rotuloCompleto}` }))

    expect(props.aoAlternarSerie).toHaveBeenCalledWith(NONO.id)
    expect(props.aoAlternarComponente).not.toHaveBeenCalled()
  })

  it('"Limpar filtros" chama aoLimpar', async () => {
    const usuario = userEvent.setup()
    const props = renderizar()

    await usuario.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(props.aoLimpar).toHaveBeenCalled()
  })

  it('não desenha nada sem seleção', () => {
    const { container } = render(
      <SelecaoAtiva
        vocabulario={VOCABULARIO_FIXTURE}
        componentesIds={[]}
        seriesIds={[]}
        metodologiasIds={[]}
        aoAlternarComponente={() => {}}
        aoAlternarSerie={() => {}}
        aoAlternarMetodologia={() => {}}
        aoLimpar={() => {}}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('id desconhecido na URL não vira pílula fantasma', () => {
    renderizar({ componentesIds: ['nao-existe-no-vocabulario'] })

    // Um link antigo com id que saiu do vocabulário não desenha pílula sem
    // nome — o item simplesmente não aparece, e o recorte segue sem ele.
    expect(screen.queryByText('nao-existe-no-vocabulario')).not.toBeInTheDocument()
  })
})

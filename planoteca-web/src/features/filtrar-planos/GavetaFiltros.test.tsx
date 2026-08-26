import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FACETAS_VAZIAS } from '@/entities/plano'
import { VOCABULARIO_FIXTURE } from '@/teste/planos'
import { GavetaFiltros } from './GavetaFiltros'

function renderizar(sobrepor: Partial<React.ComponentProps<typeof GavetaFiltros>> = {}) {
  const props = {
    pesquisa: '',
    aoMudarPesquisa: vi.fn(),
    vocabulario: VOCABULARIO_FIXTURE,
    facetas: FACETAS_VAZIAS,
    componentesIds: [] as string[],
    aoAlternarComponente: vi.fn(),
    seriesIds: [] as string[],
    aoAlternarSerie: vi.fn(),
    metodologiasIds: [] as string[],
    aoAlternarMetodologia: vi.fn(),
    totalAtivos: 0,
    totalPlanos: 14,
    aoLimpar: vi.fn(),
    ...sobrepor,
  }
  render(<GavetaFiltros {...props} />)
  return props
}

describe('GavetaFiltros', () => {
  it('o botão nasce fechado e diz "Filtros"', () => {
    renderizar()

    expect(screen.getByRole('button', { name: /Filtros/ })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('o botão mostra quantos itens estão ativos', () => {
    renderizar({ totalAtivos: 3 })

    expect(screen.getByRole('button', { name: /3 ativos/ })).toBeInTheDocument()
  })

  it('abrir mostra o painel sem o campo de busca', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('button', { name: /Filtros/ }))

    const gaveta = await screen.findByRole('dialog')
    expect(gaveta).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Matemática/ })).toBeInTheDocument()
    // A busca fica na página (RF-09), não dentro da gaveta.
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('marcar aplica na hora, sem esperar o rodapé', async () => {
    const usuario = userEvent.setup()
    const props = renderizar()

    await usuario.click(screen.getByRole('button', { name: /Filtros/ }))
    await usuario.click(await screen.findByRole('checkbox', { name: /Matemática/ }))

    expect(props.aoAlternarComponente).toHaveBeenCalledWith(
      VOCABULARIO_FIXTURE.componentes[0]!.id,
    )
  })

  it('"Ver N planos" fecha a gaveta', async () => {
    const usuario = userEvent.setup()
    renderizar({ totalPlanos: 3 })

    await usuario.click(screen.getByRole('button', { name: /Filtros/ }))
    await usuario.click(await screen.findByRole('button', { name: 'Ver 3 planos' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('"Limpar" limpa e fecha', async () => {
    const usuario = userEvent.setup()
    const props = renderizar({ totalAtivos: 2 })

    await usuario.click(screen.getByRole('button', { name: /Filtros/ }))
    await usuario.click(await screen.findByRole('button', { name: 'Limpar' }))

    expect(props.aoLimpar).toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Escape fecha', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('button', { name: /Filtros/ }))
    await screen.findByRole('dialog')
    await usuario.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('o singular concorda quando só há um plano', async () => {
    const usuario = userEvent.setup()
    renderizar({ totalPlanos: 1 })

    await usuario.click(screen.getByRole('button', { name: /Filtros/ }))

    expect(await screen.findByRole('button', { name: 'Ver 1 plano' })).toBeInTheDocument()
  })
})

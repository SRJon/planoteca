import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SERIES_FIXTURE } from '@/teste/planos'
import { ReguaSeries } from './ReguaSeries'

describe('ReguaSeries', () => {
  it('desenha uma célula por série, com a sigla à vista e o nome completo no rótulo', () => {
    render(<ReguaSeries series={SERIES_FIXTURE} selecionadas={[]} aoAlternar={() => {}} />)

    const botoes = screen.getAllByRole('button')
    expect(botoes).toHaveLength(SERIES_FIXTURE.length)

    // A sigla é o que se vê; o nome completo é o que o leitor de tela
    // anuncia. "2ªEM" não se lê sozinho.
    const sexto = screen.getByRole('button', { name: '6º ano do Ensino Fundamental' })
    expect(sexto).toHaveTextContent('6º')
  })

  it('marca a série selecionada com aria-pressed', () => {
    const nono = SERIES_FIXTURE[3]!
    render(<ReguaSeries series={SERIES_FIXTURE} selecionadas={[nono.id]} aoAlternar={() => {}} />)

    expect(screen.getByRole('button', { name: nono.rotuloCompleto })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: SERIES_FIXTURE[0]!.rotuloCompleto })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('chama aoAlternar com o id da série tocada', async () => {
    const usuario = userEvent.setup()
    const aoAlternar = vi.fn()
    render(<ReguaSeries series={SERIES_FIXTURE} selecionadas={[]} aoAlternar={aoAlternar} />)

    await usuario.click(screen.getByRole('button', { name: SERIES_FIXTURE[1]!.rotuloCompleto }))

    expect(aoAlternar).toHaveBeenCalledWith(SERIES_FIXTURE[1]!.id)
  })

  it('não desenha nada quando não há série', () => {
    const { container } = render(
      <ReguaSeries series={[]} selecionadas={[]} aoAlternar={() => {}} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})

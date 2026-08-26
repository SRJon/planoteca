import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GrupoFiltro } from './GrupoFiltro'

/** Doze itens: quatro a mais que o limite de 8 do RF-07. */
const DOZE = Array.from({ length: 12 }, (_, indice) => ({
  id: `id-${indice + 1}`,
  nome: `Item ${indice + 1}`,
}))

const CONTAGENS = DOZE.map((item, indice) => ({ id: item.id, total: 12 - indice }))

describe('GrupoFiltro', () => {
  it('com 12 itens mostra 8 e um botão "mais 4"', () => {
    render(
      <GrupoFiltro
        titulo="Componente"
        itens={DOZE}
        selecionados={[]}
        contagens={CONTAGENS}
        aoAlternar={() => {}}
      />,
    )

    expect(screen.getAllByRole('checkbox')).toHaveLength(8)
    expect(screen.getByRole('button', { name: 'mais 4' })).toBeInTheDocument()
  })

  it('expandir mostra os 12, e o botão passa a recolher', async () => {
    const usuario = userEvent.setup()
    render(
      <GrupoFiltro
        titulo="Componente"
        itens={DOZE}
        selecionados={[]}
        contagens={CONTAGENS}
        aoAlternar={() => {}}
      />,
    )

    await usuario.click(screen.getByRole('button', { name: 'mais 4' }))

    expect(screen.getAllByRole('checkbox')).toHaveLength(12)
    expect(screen.getByRole('button', { name: 'Mostrar menos' })).toBeInTheDocument()
  })

  it('item marcado na posição 11 aparece sem expandir', () => {
    const decimoPrimeiro = DOZE[10]!
    render(
      <GrupoFiltro
        titulo="Componente"
        itens={DOZE}
        selecionados={[decimoPrimeiro.id]}
        contagens={CONTAGENS}
        aoAlternar={() => {}}
      />,
    )

    // Marcado fora dos oito primeiros continua VISÍVEL: esconder o que a
    // pessoa acabou de marcar faria a seleção parecer que se perdeu.
    const marcado = screen.getByRole('checkbox', { name: /Item 11/ })
    expect(marcado).toBeChecked()
    // Ele entra ALÉM dos oito, e não no lugar de um deles.
    expect(screen.getAllByRole('checkbox')).toHaveLength(9)
    expect(screen.getByRole('button', { name: 'mais 4' })).toBeInTheDocument()
  })

  it('mostra a contagem de cada item, e zero para o id ausente da resposta', () => {
    render(
      <GrupoFiltro
        titulo="Componente"
        itens={DOZE.slice(0, 2)}
        selecionados={[]}
        // O segundo item NÃO consta: a API só devolve id com pelo menos um
        // plano (RF-01), e o ausente vale zero.
        contagens={[{ id: 'id-1', total: 12 }]}
        aoAlternar={() => {}}
      />,
    )

    const primeiro = screen.getByRole('checkbox', { name: /Item 1/ }).closest('label')!
    expect(within(primeiro).getByText('12')).toBeInTheDocument()

    const segundo = screen.getByRole('checkbox', { name: /Item 2/ }).closest('label')!
    expect(within(segundo).getByText('0')).toBeInTheDocument()
    // Contagem zero fica visível e clicável (RF-06).
    expect(screen.getByRole('checkbox', { name: /Item 2/ })).toBeEnabled()
  })

  it('chama aoAlternar com o id do item marcado', async () => {
    const usuario = userEvent.setup()
    const aoAlternar = vi.fn()
    render(
      <GrupoFiltro
        titulo="Componente"
        itens={DOZE}
        selecionados={[]}
        contagens={CONTAGENS}
        aoAlternar={aoAlternar}
      />,
    )

    await usuario.click(screen.getByRole('checkbox', { name: /Item 3/ }))

    expect(aoAlternar).toHaveBeenCalledWith('id-3')
  })

  it('o resumo traz o nome do grupo e o total de itens', () => {
    render(
      <GrupoFiltro
        titulo="Metodologia"
        itens={DOZE}
        selecionados={[]}
        contagens={CONTAGENS}
        aoAlternar={() => {}}
      />,
    )

    const resumo = screen.getByText('Metodologia').closest('summary')!
    expect(within(resumo).getByText('· 12')).toBeInTheDocument()
  })

  it('com sigla, desenha o bloco de cor do componente', () => {
    render(
      <GrupoFiltro
        titulo="Componente"
        comSigla
        itens={[{ id: 'id-ma', nome: 'Matemática', sigla: 'MA', cor: 'comp-matematica' }]}
        selecionados={[]}
        contagens={[{ id: 'id-ma', total: 3 }]}
        aoAlternar={() => {}}
      />,
    )

    const bloco = screen.getByText('MA')
    expect(bloco).toHaveClass('bg-comp-matematica')
    // A sigla é pista VISUAL redundante: o nome por extenso vem ao lado.
    expect(bloco).toHaveAttribute('aria-hidden', 'true')
  })

  it('não desenha nada quando não há item', () => {
    const { container } = render(
      <GrupoFiltro
        titulo="Componente"
        itens={[]}
        selecionados={[]}
        contagens={[]}
        aoAlternar={() => {}}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})

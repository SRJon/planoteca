import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { Plano } from '@/entities/plano'
import { COMPONENTES_FIXTURE, METODOLOGIAS_FIXTURE, SERIES_FIXTURE } from '@/teste/planos'
import { FichaPlano } from './FichaPlano'

/** Um plano COM anexo. Os testes de ausência partem deste e tiram o campo,
 * para que a única diferença entre os dois casos seja o `arquivoUrl`. */
const PLANO_BASE: Plano = {
  id: '10000000-0000-0000-0000-000000000001',
  titulo: 'Escape Room: Missão Termoscópio',
  autoria: 'Anna Ruth de Souza e Souza',
  objetosConhecimento: 'Escalas Termométricas',
  componentePrincipal: COMPONENTES_FIXTURE[2]!,
  componentesSecundarios: [],
  series: [SERIES_FIXTURE[3]!],
  metodologias: [METODOLOGIAS_FIXTURE[3]!],
  duracaoAulas: 2,
  duracaoDescricao: null,
  arquivoUrl: '/planos/plano-001.pdf',
  publicadoEm: '2026-08-01T12:00:00Z',
  situacao: 'publicado',
}

function renderizar(plano: Plano) {
  // `MemoryRouter`: o título da ficha é um `Link` para `/biblioteca/:id`.
  return render(
    <MemoryRouter>
      <FichaPlano plano={plano} />
    </MemoryRouter>,
  )
}

describe('FichaPlano', () => {
  it('mostra o botão de baixar quando há anexo', () => {
    renderizar(PLANO_BASE)
    expect(screen.getByRole('link', { name: /Baixar plano/ })).toHaveAttribute('download')
  })

  it('sem anexo, some só o botão de baixar — a ficha continua inteira', () => {
    // `arquivoUrl` AUSENTE, não `undefined`: é a forma que a API produz, e
    // com `exactOptionalPropertyTypes` as duas não são a mesma coisa. Daí o
    // `delete` numa cópia, em vez do descarte por desestruturação — a
    // variável ignorada que ele criaria reprova no lint.
    const semAnexo: Plano = { ...PLANO_BASE }
    delete semAnexo.arquivoUrl
    renderizar(semAnexo)

    expect(screen.queryByRole('link', { name: /Baixar plano/ })).not.toBeInTheDocument()

    // Nada ocupa o lugar do botão: nem aviso, nem botão desabilitado. O
    // plano sem arquivo é caso normal, e anunciá-lo o faria parecer falha.
    expect(screen.queryByText(/sem arquivo/i)).not.toBeInTheDocument()

    // E o que o card existe para mostrar continua lá.
    expect(screen.getByRole('link', { name: PLANO_BASE.titulo })).toBeInTheDocument()
    // O componente e as séries dividem a MESMA linha ("Química · 9º"), então
    // a busca é por trecho, não por texto exato.
    expect(screen.getByText(/Química/)).toBeInTheDocument()
    expect(screen.getByText('QU')).toBeInTheDocument()
    expect(screen.getByText('Escape Room')).toBeInTheDocument()
    expect(screen.getByText('Anna Ruth de Souza e Souza')).toBeInTheDocument()
  })
})

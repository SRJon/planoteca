import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { criarCliente } from '@/shared/api'
import { COMPONENTES_FIXTURE, POSTS_FIXTURE } from '@/teste/planos'
import { PaginaInicio } from './PaginaInicio'

const BASE = 'https://api.teste'

/** Espia a URL corrente. A landing navega (busca do hero, links de área), e
 * o que interessa provar é o DESTINO — não uma tela de Biblioteca montada. */
function UrlAtual() {
  const local = useLocation()
  return <output data-testid="url">{`${local.pathname}${local.search}`}</output>
}

function renderizar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <UrlAtual />
        <Routes>
          <Route
            path="*"
            element={
              <PaginaInicio
                cliente={criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    </QueryClientProvider>,
  )
}

/** As áreas saem da fixture, não de uma lista escrita aqui: a tela as deriva
 * do vocabulário, e um teste com nomes fixos passaria a mentir no dia em que
 * a fixture ganhasse uma área. */
const AREAS_ESPERADAS = [...new Set(COMPONENTES_FIXTURE.map((c) => c.area))]
const HUMANAS = COMPONENTES_FIXTURE.filter(
  (c) => c.area === 'Ciências Humanas e Sociais Aplicadas',
)

/** Mesma razão: os publicados saem da fixture. Um dia ela ganha um segundo
 * relato, e o teste passa a cobri-lo sozinho. */
const PUBLICADOS = POSTS_FIXTURE.filter((p) => p.situacao === 'publicado')

describe('PaginaInicio', () => {
  it('mostra um card por área do conhecimento do vocabulário', async () => {
    renderizar()

    for (const area of AREAS_ESPERADAS) {
      expect(await screen.findByRole('button', { name: new RegExp(area) })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('button', { name: /componente/ })).toHaveLength(
      AREAS_ESPERADAS.length,
    )
  })

  it('o cabeçalho de uma área abre os componentes filhos, cada um com o filtro na URL', async () => {
    renderizar()

    const cabecalho = await screen.findByRole('button', {
      name: /Ciências Humanas e Sociais Aplicadas/,
    })
    expect(cabecalho).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(cabecalho)
    expect(cabecalho).toHaveAttribute('aria-expanded', 'true')

    // O `aria-controls` é o que amarra o cabeçalho à lista — buscar pelo id
    // dele prova a ligação, e não só que os links existem em algum lugar.
    const lista = document.getElementById(cabecalho.getAttribute('aria-controls')!)!
    for (const componente of HUMANAS) {
      expect(within(lista).getByRole('link', { name: componente.nome })).toHaveAttribute(
        'href',
        `/biblioteca?componente=${componente.id}`,
      )
    }
  })

  it('a busca do hero leva para a Biblioteca com o termo na querystring', async () => {
    renderizar()

    await userEvent.type(
      screen.getByRole('searchbox', { name: /Buscar por assunto/ }),
      'juros',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(screen.getByTestId('url')).toHaveTextContent('/biblioteca?q=juros')
  })

  it('"Ver os planos" aponta para a Biblioteca sem recorte', () => {
    renderizar()

    expect(screen.getByRole('link', { name: 'Ver os planos' })).toHaveAttribute(
      'href',
      '/biblioteca',
    )
  })

  it('mostra os últimos textos PUBLICADOS do blog, no máximo três', async () => {
    renderizar()

    // O teto vem da fixture, não do número 3 escrito aqui: hoje ela tem um
    // publicado só, e uma asserção fixa em 3 estaria mentindo. O que a
    // seção promete é "no máximo três", e é isso que se afirma.
    const esperados = PUBLICADOS.slice(0, 3)
    expect(esperados.length).toBeGreaterThan(0)

    for (const post of esperados) {
      expect(await screen.findByRole('link', { name: post.titulo })).toHaveAttribute(
        'href',
        `/blog/${post.id}`,
      )
    }

    // Pendente, devolvido e arquivado não existem para quem chega de fora.
    for (const post of POSTS_FIXTURE.filter((p) => p.situacao !== 'publicado')) {
      expect(screen.queryByRole('link', { name: post.titulo })).not.toBeInTheDocument()
    }

    expect(screen.getAllByRole('link', { name: 'Ler o relato →' })).toHaveLength(esperados.length)
    expect(esperados.length).toBeLessThanOrEqual(3)
  })
})

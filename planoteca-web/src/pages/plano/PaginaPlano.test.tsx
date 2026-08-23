import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { criarCliente } from '@/shared/api'
import { servidor } from '@/teste/servidor'
import { PaginaPlano } from './PaginaPlano'

const BASE = 'https://api.teste'
/** O primeiro plano da fixture (`gerarPlanos`): Matemática, 6º ano. */
const ID_EXISTENTE = '10000000-0000-0000-0000-000000000001'
/** O terceiro: interdisciplinar, com Arte secundária e duas séries. */
const ID_INTERDISCIPLINAR = '10000000-0000-0000-0000-000000000003'

function renderizar(id: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      {/* A rota real é `/biblioteca/:id`, e a página lê `id` de `useParams` —
          montar sem o `Route` deixaria o parâmetro indefinido e a busca
          desabilitada, testando outra coisa. */}
      <MemoryRouter initialEntries={[`/biblioteca/${id}`]}>
        <Routes>
          <Route
            path="/biblioteca/:id"
            element={
              <PaginaPlano
                cliente={criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PaginaPlano', () => {
  it('mostra a ficha completa sem exigir login', async () => {
    renderizar(ID_EXISTENTE)

    expect(
      await screen.findByRole('heading', { name: 'Plano001 de exemplo', level: 1 }),
    ).toBeInTheDocument()
    // O que o briefing pede que fique visível SEM abrir o PDF.
    expect(screen.getByText(/Objetivo da prática Plano001/)).toBeInTheDocument()
    expect(screen.getByText(/Expectativas de aprendizagem de Plano001/)).toBeInTheDocument()
    expect(screen.getByText(/Cartões de pistas/)).toBeInTheDocument()
  })

  it('mostra o roteiro em passos, na ordem', async () => {
    renderizar(ID_EXISTENTE)

    await screen.findByRole('heading', { name: 'Plano001 de exemplo', level: 1 })

    const passos = screen.getAllByRole('listitem')
    expect(passos).toHaveLength(2)
    expect(passos[0]).toHaveTextContent('Início da Missão')
    expect(passos[1]).toHaveTextContent('Formação das Equipes')
  })

  it('mostra as duas séries e os dois componentes da prática interdisciplinar', async () => {
    renderizar(ID_INTERDISCIPLINAR)

    await screen.findByRole('heading', { name: 'Plano003 de exemplo', level: 1 })

    // Duas séries num plano só — o caso que motivou a ligação N:N.
    expect(
      screen.getByText('8º ano do Ensino Fundamental · 9º ano do Ensino Fundamental'),
    ).toBeInTheDocument()
    // Química é o principal (pinta o bloco); Arte aparece ao lado.
    expect(screen.getByText(/Química · Arte/)).toBeInTheDocument()
    // As duas metodologias, ao contrário do card, que mostra uma e "+1".
    expect(screen.getByText('Escape Room')).toBeInTheDocument()
    expect(screen.getByText('Rotação por Estações de Aprendizagem')).toBeInTheDocument()
  })

  it('não anuncia BNCC quando o plano não tem nenhum código', async () => {
    renderizar(ID_EXISTENTE)

    await screen.findByRole('heading', { name: 'Plano001 de exemplo', level: 1 })

    // A maioria dos planos do acervo real não traz código. Um rótulo "BNCC"
    // com traço em toda ficha anunciaria uma ausência que não é falha.
    expect(screen.queryByText('BNCC')).not.toBeInTheDocument()
  })

  it('oferece o download como link, no topo e no rodapé', async () => {
    renderizar(ID_EXISTENTE)

    await screen.findByRole('heading', { name: 'Plano001 de exemplo', level: 1 })

    // Dois: quem já decidiu não deveria rolar a ficha inteira para baixar.
    const downloads = screen.getAllByRole('link', { name: /Baixar plano/ })
    expect(downloads).toHaveLength(2)
    for (const link of downloads) {
      // Um `a` com `download`, não um botão: baixar É navegar.
      expect(link).toHaveAttribute('download')
      expect(link).toHaveAttribute('href', '/planos/plano-001.pdf')
    }
  })

  it('um id desconhecido vira "não está no acervo", com saída para a Biblioteca', async () => {
    renderizar('10000000-0000-0000-0000-000000000999')

    expect(
      await screen.findByRole('heading', { name: 'Este plano não está no acervo' }),
    ).toBeInTheDocument()
    // Sem saída, a tela seria um beco: o endereço veio de um link torto, e
    // quem chegou não tem como voltar.
    expect(screen.getByRole('link', { name: 'Ver a Biblioteca' })).toHaveAttribute(
      'href',
      '/biblioteca',
    )
  })

  it('distingue plano ausente de falha de rede', async () => {
    servidor.use(
      http.get('*/api/v1/lesson-plans/:id', () =>
        HttpResponse.json({ status: 500, messages: ['Falha ao consultar o plano.'] }, { status: 500 }),
      ),
    )
    renderizar(ID_EXISTENTE)

    // 500 é alerta de erro, e NÃO a tela de "não está no acervo": dizer que
    // o plano não existe quando o servidor caiu é mentir para quem procura.
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao consultar o plano.')
  })
})

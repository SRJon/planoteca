import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { criarCliente } from '@/shared/api'
import { servidor } from '@/teste/servidor'
import { PaginaBlog } from './PaginaBlog'
import { PaginaPost } from './PaginaPost'

const BASE = 'https://api.teste'
const PUBLICADO = '70000000-0000-0000-0000-000000000001'
/** Um texto pendente da fixture — não deve aparecer para quem chega de fora. */
const PENDENTE = '70000000-0000-0000-0000-000000000002'

function cliente() {
  return criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })
}

function renderizar(url: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/blog" element={<PaginaBlog cliente={cliente()} />} />
          <Route path="/blog/:id" element={<PaginaPost cliente={cliente()} />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Blog público', () => {
  it('lista apenas os textos publicados', async () => {
    renderizar('/blog')

    expect(await screen.findByText('Escape Room na aula de Química')).toBeInTheDocument()
    // A fixture tem um pendente e um devolvido. Nenhum dos dois existe para
    // quem chega de fora — a API nem os devolve.
    expect(screen.queryByText('Rotação por estações em turma grande')).not.toBeInTheDocument()
    expect(screen.queryByText('Gamificação no 7º ano')).not.toBeInTheDocument()
  })

  it('mostra autoria e data de cada texto', async () => {
    renderizar('/blog')

    await screen.findByText('Escape Room na aula de Química')
    expect(screen.getByText(/Professora Ana/)).toBeInTheDocument()
  })

  it('abre um texto e mostra o corpo com as quebras de linha', async () => {
    renderizar(`/blog/${PUBLICADO}`)

    expect(
      await screen.findByRole('heading', { name: 'Escape Room na aula de Química', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Relato completo da prática/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao Blog' })).toHaveAttribute('href', '/blog')
  })

  it('um texto não publicado responde como ausente, não como proibido', async () => {
    renderizar(`/blog/${PENDENTE}`)

    // 404, e não 403: dizer "existe, mas você não pode ver" vazaria a
    // existência de rascunho alheio.
    expect(
      await screen.findByRole('heading', { name: 'Este texto não está publicado' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver o Blog' })).toBeInTheDocument()
  })

  it('convida a escrever quando não há nenhum texto', async () => {
    servidor.use(http.get('*/api/v1/posts', () => new HttpResponse(null, { status: 204 })))
    renderizar('/blog')

    expect(
      await screen.findByRole('heading', { name: 'Nenhum texto publicado ainda' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entrar para escrever' })).toBeInTheDocument()
  })

  it('mostra o erro da API em vez de uma lista vazia silenciosa', async () => {
    servidor.use(
      http.get('*/api/v1/posts', () =>
        HttpResponse.json({ status: 500, messages: ['Falha ao consultar o blog.'] }, { status: 500 }),
      ),
    )
    renderizar('/blog')

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao consultar o blog.')
  })
})

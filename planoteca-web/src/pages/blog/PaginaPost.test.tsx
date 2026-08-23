import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarCliente } from '@/shared/api'
import { servidor } from '@/teste/servidor'
import { PaginaPost } from './PaginaPost'

const BASE = 'https://api.teste'
const PUBLICADO = '70000000-0000-0000-0000-000000000001'

function cliente() {
  return criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })
}

function renderizar(id: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/blog/${id}`]}>
        <Routes>
          <Route path="/blog/:id" element={<PaginaPost cliente={cliente()} />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PaginaPost — o contador de visualizações', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mostra a contagem que a API devolveu', async () => {
    renderizar(PUBLICADO)

    await screen.findByRole('heading', { name: 'Escape Room na aula de Química', level: 1 })
    // A fixture (`src/teste/planos.ts`) marca este texto com 42 leituras.
    expect(await screen.findByText(/42 leituras/)).toBeInTheDocument()
  })

  it('soma uma visualização ao abrir o texto', async () => {
    let chamadas = 0
    servidor.use(
      http.post('*/api/v1/posts/:id/visualizacao', () => {
        chamadas += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderizar(PUBLICADO)
    await screen.findByRole('heading', { name: 'Escape Room na aula de Química', level: 1 })

    await vi.waitFor(() => expect(chamadas).toBe(1))
  })

  it('não soma de novo no mesmo navegador dentro de 24h', async () => {
    let chamadas = 0
    servidor.use(
      http.post('*/api/v1/posts/:id/visualizacao', () => {
        chamadas += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )

    // Simula uma leitura de 1 minuto atrás, já registrada pelo navegador.
    window.localStorage.setItem(
      `planoteca:post-visualizado:${PUBLICADO}`,
      String(Date.now() - 60_000),
    )

    renderizar(PUBLICADO)
    await screen.findByRole('heading', { name: 'Escape Room na aula de Química', level: 1 })

    // Dá tempo do efeito rodar, se fosse rodar — e ele não deve.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(chamadas).toBe(0)
  })

  it('soma de novo depois de 24h', async () => {
    let chamadas = 0
    servidor.use(
      http.post('*/api/v1/posts/:id/visualizacao', () => {
        chamadas += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const VINTE_CINCO_HORAS_MS = 25 * 60 * 60 * 1000
    window.localStorage.setItem(
      `planoteca:post-visualizado:${PUBLICADO}`,
      String(Date.now() - VINTE_CINCO_HORAS_MS),
    )

    renderizar(PUBLICADO)
    await screen.findByRole('heading', { name: 'Escape Room na aula de Química', level: 1 })

    await vi.waitFor(() => expect(chamadas).toBe(1))
  })

  it('a falha do incremento não impede a leitura do texto', async () => {
    servidor.use(
      http.post('*/api/v1/posts/:id/visualizacao', () =>
        HttpResponse.json({ status: 500, messages: ['Falha interna.'] }, { status: 500 }),
      ),
    )

    renderizar(PUBLICADO)

    // O texto continua legível mesmo com o contador falhando — a chamada é
    // silenciosa de propósito (`registrarVisualizacao` em `entities/post/api.ts`).
    expect(
      await screen.findByRole('heading', { name: 'Escape Room na aula de Química', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Relato completo da prática/)).toBeInTheDocument()
  })

  it('renderiza o HTML do corpo — negrito, título e lista aparecem formatados', async () => {
    servidor.use(
      http.get('*/api/v1/posts/:id', ({ params }) =>
        HttpResponse.json({
          id: params['id'],
          titulo: 'Escape Room na aula de Química',
          resumo: null,
          corpo: '<p>Um <strong>relato</strong> com lista:</p><ul><li>Item um</li></ul>',
          autorNome: 'Professora Ana',
          situacao: 'publicado',
          publicadoEm: '2026-08-10T12:00:00Z',
          criadoEm: '2026-08-08T12:00:00Z',
          comentarioModeracao: null,
          visualizacoes: 42,
        }),
      ),
    )

    renderizar(PUBLICADO)

    await screen.findByRole('heading', { name: 'Escape Room na aula de Química', level: 1 })
    expect(screen.getByText('relato', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText('Item um', { selector: 'li' })).toBeInTheDocument()
  })

  it('post antigo (texto puro, sem tag) continua legível', async () => {
    // A fixture do post publicado (`src/teste/planos.ts`) é texto puro com
    // `\n\n` — o formato de antes do editor rico existir. O front não
    // reformata: quem separa em parágrafo é o `HtmlSanitizerService` da API
    // (`PrepararConteudoLegado`), e este teste cobre só a metade do front —
    // que o texto aparece, inteiro, sem quebrar a tela.
    renderizar(PUBLICADO)

    await screen.findByRole('heading', { name: 'Escape Room na aula de Química', level: 1 })
    expect(screen.getByText(/Relato completo da prática/)).toBeInTheDocument()
    expect(screen.getByText(/Segundo parágrafo do relato/)).toBeInTheDocument()
  })

  it('não quebra quando o localStorage lança (modo anônimo)', async () => {
    const original = window.localStorage.getItem.bind(window.localStorage)
    vi.spyOn(window.localStorage, 'getItem').mockImplementation((chave) => {
      if (chave.startsWith('planoteca:post-visualizado:')) {
        throw new DOMException('Acesso negado', 'SecurityError')
      }
      return original(chave)
    })

    renderizar(PUBLICADO)

    expect(
      await screen.findByRole('heading', { name: 'Escape Room na aula de Química', level: 1 }),
    ).toBeInTheDocument()
  })
})

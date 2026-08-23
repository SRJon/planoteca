import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { criarCliente } from '@/shared/api'
import { servidor } from '@/teste/servidor'
import { PaginaModeracao } from './PaginaModeracao'

const BASE = 'https://api.teste'

function renderizar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/moderacao']}>
        <PaginaModeracao
          cliente={criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PaginaModeracao', () => {
  it('abre na fila de pendentes, que é o que precisa de atenção', async () => {
    renderizar()

    // O briefing: o painel "mostra primeiro o que precisa de atenção:
    // textos aguardando aprovação".
    expect(await screen.findByText('Rotação por estações em turma grande')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aguardando' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('lê o texto sem sair da fila', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Rotação por estações em turma grande')
    await usuario.click(screen.getByRole('button', { name: 'Ler o texto' }))

    // Moderar é ler e decidir. Navegar de ida e volta para cada texto de uma
    // fila de vinte é o atrito que faz a fila não andar.
    expect(await screen.findByText('Texto aguardando aprovação.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publicar' })).toBeInTheDocument()
  })

  it('recusa devolver sem comentário, antes de tocar na rede', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Rotação por estações em turma grande')
    await usuario.click(screen.getByRole('button', { name: 'Ler o texto' }))
    await usuario.click(await screen.findByRole('button', { name: 'Devolver para ajuste' }))

    // RF-11: devolver sem dizer o motivo transforma moderação em silêncio.
    expect(
      await screen.findByText('Diga ao autor por que o texto foi devolvido ou recusado.'),
    ).toBeInTheDocument()
  })

  it('publica sem exigir comentário', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Rotação por estações em turma grande')
    await usuario.click(screen.getByRole('button', { name: 'Ler o texto' }))
    await usuario.click(await screen.findByRole('button', { name: 'Publicar' }))

    // Publicar não precisa de justificativa — só devolver e recusar.
    expect(
      screen.queryByText('Diga ao autor por que o texto foi devolvido ou recusado.'),
    ).not.toBeInTheDocument()
  })

  it('troca de aba e mostra o comentário anterior do texto devolvido', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Rotação por estações em turma grande')
    await usuario.click(screen.getByRole('button', { name: 'Devolvidos' }))

    expect(await screen.findByText('Gamificação no 7º ano')).toBeInTheDocument()
    // O motivo da devolução fica visível na fila: quem modera precisa saber
    // o que já foi pedido antes de cobrar de novo.
    expect(screen.getByText(/Acrescente as fotos da atividade/)).toBeInTheDocument()
  })

  it('celebra a fila vazia em vez de mostrar uma lista em branco', async () => {
    servidor.use(http.get('*/api/v1/admin/posts', () => new HttpResponse(null, { status: 204 })))
    renderizar()

    expect(await screen.findByText('Nenhum texto aguardando. A fila está vazia.')).toBeInTheDocument()
  })

  it('mostra o erro da API ao moderar', async () => {
    servidor.use(
      http.post('*/api/v1/admin/posts/:id/moderacao', () =>
        HttpResponse.json(
          { status: 400, messages: ['Este texto já foi moderado por outra pessoa.'] },
          { status: 400 },
        ),
      ),
    )
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Rotação por estações em turma grande')
    await usuario.click(screen.getByRole('button', { name: 'Ler o texto' }))
    await usuario.click(await screen.findByRole('button', { name: 'Publicar' }))

    expect(
      await screen.findByText('Este texto já foi moderado por outra pessoa.'),
    ).toBeInTheDocument()
  })
})

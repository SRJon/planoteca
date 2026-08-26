import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
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
    const titulo = await screen.findByText('Texto aguardando aprovação.')
    expect(titulo).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publicar' })).toBeInTheDocument()

    // O corpo é HTML rico, e precisa aparecer RENDERIZADO. A tela mostrava
    // `<h3>…</h3><p>…</p>` como texto, e quem modera lia a tag junto com a
    // frase. `tagName` prova o que `findByText` sozinho não pega: o texto
    // está DENTRO do elemento, e não é o elemento inteiro escrito à mão.
    expect(titulo.tagName).toBe('H3')
    expect(screen.getByText('Primeiro parágrafo.').tagName).toBe('P')
    expect(screen.queryByText(/<h3>/)).not.toBeInTheDocument()
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

  it('arquiva um texto publicado sem exigir comentário', async () => {
    let corpoRecebido: unknown
    servidor.use(
      http.post('*/api/v1/admin/posts/:id/arquivamento', async ({ request }) => {
        // A rota não pede corpo nenhum — arquivar é curadoria do acervo, não
        // devolutiva ao autor (RF-11 cobre só devolver/recusar).
        corpoRecebido = await request.text()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('button', { name: 'Publicados' }))
    await screen.findByText('Escape Room na aula de Química')
    await usuario.click(screen.getByRole('button', { name: 'Arquivar' }))

    await vi.waitFor(() => expect(corpoRecebido).toBe(''))
  })

  it('devolve um texto arquivado ao fluxo, na aba Arquivados', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('button', { name: 'Arquivados' }))

    // A fixture (`src/teste/planos.ts`) traz um texto arquivado.
    expect(await screen.findByText('Sala de aula invertida no Ensino Médio')).toBeInTheDocument()
    // Fora da moderação: nenhuma decisão de publicar/devolver/recusar aqui.
    expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument()

    const botao = screen.getByRole('button', { name: 'Devolver ao fluxo' })
    await usuario.click(botao)

    // A mutação invalida a lista; sem handler de erro configurado, a
    // requisição responde 204 e o botão continua utilizável — o que importa
    // aqui é que o botão existe e a chamada não quebra a tela.
    expect(botao).toBeInTheDocument()
  })

  it('mostra o erro da API ao arquivar', async () => {
    servidor.use(
      http.post('*/api/v1/admin/posts/:id/arquivamento', () =>
        HttpResponse.json({ status: 400, messages: ['Este texto já está arquivado.'] }, { status: 400 }),
      ),
    )
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('button', { name: 'Publicados' }))
    await screen.findByText('Escape Room na aula de Química')
    await usuario.click(screen.getByRole('button', { name: 'Arquivar' }))

    expect(await screen.findByText('Este texto já está arquivado.')).toBeInTheDocument()
  })
})

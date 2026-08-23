import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { criarCliente } from '@/shared/api'
import { servidor } from '@/teste/servidor'
import { PaginaPlanos } from './PaginaPlanos'

const BASE = 'https://api.teste'

function renderizar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/planos']}>
        <PaginaPlanos
          cliente={criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PaginaPlanos', () => {
  it('lista os planos do acervo com a situação de cada um', async () => {
    renderizar()

    expect(await screen.findByRole('heading', { name: 'Planos do acervo', level: 1 })).toBeInTheDocument()
    expect(await screen.findByText('Plano001 de exemplo')).toBeInTheDocument()
    // A situação é o que esta tela mostra e a Biblioteca não: aqui o
    // administrador vê o que ainda está em rascunho.
    expect(screen.getAllByText('Publicado').length).toBeGreaterThan(0)
  })

  it('plano publicado oferece despublicar, e não remover', async () => {
    renderizar()

    await screen.findByText('Plano001 de exemplo')

    expect(screen.getAllByRole('button', { name: 'Despublicar' }).length).toBeGreaterThan(0)
    // Remover só existe para rascunho: um plano publicado já circulou, e
    // apagá-lo quebraria os links que professores compartilharam.
    expect(screen.queryByRole('button', { name: /^Remover/ })).not.toBeInTheDocument()
  })

  it('leva à ficha pública do plano publicado', async () => {
    renderizar()

    const titulo = await screen.findByRole('link', { name: 'Plano001 de exemplo' })
    expect(titulo).toHaveAttribute('href', '/biblioteca/10000000-0000-0000-0000-000000000001')
  })

  it('mostra a mensagem da API quando a remoção é recusada', async () => {
    // A fixture devolve tudo como publicado, então forço um rascunho para
    // ter o botão de remover na tela.
    servidor.use(
      http.get('*/api/v1/admin/lesson-plans', () =>
        HttpResponse.json(
          [
            {
              id: '10000000-0000-0000-0000-000000000001',
              titulo: 'Rascunho de exemplo',
              autoria: 'Autoria 1',
              objetosConhecimento: 'Objeto',
              componentePrincipal: null,
              componentesSecundarios: [],
              series: [],
              metodologias: [],
              duracaoAulas: null,
              duracaoDescricao: null,
              arquivoUrl: '/x.pdf',
              publicadoEm: null,
              situacao: 'rascunho',
            },
          ],
          { headers: { 'X-Total-Count': '1' } },
        ),
      ),
    )
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Rascunho de exemplo')
    await usuario.click(screen.getByRole('button', { name: /^Remover/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Despublique antes de remover')
  })

  it('convida a catalogar quando o acervo está vazio', async () => {
    servidor.use(
      http.get('*/api/v1/admin/lesson-plans', () => new HttpResponse(null, { status: 204 })),
    )
    renderizar()

    expect(
      await screen.findByRole('heading', { name: 'O acervo ainda está vazio' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Catalogar o primeiro plano' })).toBeInTheDocument()
  })
})

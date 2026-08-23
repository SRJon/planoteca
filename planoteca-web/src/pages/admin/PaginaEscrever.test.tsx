import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { criarCliente } from '@/shared/api'
import { servidor } from '@/teste/servidor'
import { PaginaEscrever } from './PaginaEscrever'

const BASE = 'https://api.teste'

function renderizar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/escrever']}>
        <PaginaEscrever
          cliente={criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PaginaEscrever — o editor de texto rico', () => {
  it('aplica negrito e o botão reflete o estado do cursor', async () => {
    const usuario = userEvent.setup({ delay: null })
    renderizar()

    const editor = await screen.findByRole('textbox', { name: '' })
    await usuario.click(editor)
    await usuario.keyboard('texto em negrito')
    await usuario.keyboard('{Control>}a{/Control}')

    const botaoNegrito = screen.getByRole('button', { name: 'Negrito' })
    expect(botaoNegrito).toHaveAttribute('aria-pressed', 'false')

    await usuario.click(botaoNegrito)

    await waitFor(() => expect(botaoNegrito).toHaveAttribute('aria-pressed', 'true'))
    expect(editor.querySelector('strong')).toHaveTextContent('texto em negrito')
  })

  it('envia o HTML do editor no corpo do texto', async () => {
    let corpoEnviado = ''
    servidor.use(
      http.post('*/api/v1/admin/posts', async ({ request }) => {
        const corpo = (await request.json()) as { corpo: string }
        corpoEnviado = corpo.corpo
        return HttpResponse.json({ id: '70000000-0000-0000-0000-000000000900' }, { status: 201 })
      }),
    )

    const usuario = userEvent.setup({ delay: null })
    renderizar()

    await usuario.type(screen.getByLabelText('Título'), 'Um relato de sala')

    const editor = await screen.findByRole('textbox', { name: '' })
    await usuario.click(editor)
    await usuario.keyboard('texto em negrito')
    await usuario.keyboard('{Control>}a{/Control}')
    await usuario.click(screen.getByRole('button', { name: 'Negrito' }))

    await usuario.click(screen.getByRole('button', { name: 'Enviar para aprovação' }))

    await waitFor(() => expect(corpoEnviado).toContain('<strong>'))
    expect(corpoEnviado).toContain('texto em negrito')
  })

  it('recusa envio com o editor vazio', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.type(screen.getByLabelText('Título'), 'Título sem corpo')
    await usuario.click(screen.getByRole('button', { name: 'Enviar para aprovação' }))

    expect(await screen.findAllByText('Campo obrigatório.')).not.toHaveLength(0)
  })

  it('mostra o toolbar com aria-label em cada botão de formatação', async () => {
    renderizar()
    await screen.findByRole('textbox', { name: '' })

    const barra = screen.getByRole('toolbar', { name: 'Formatação do texto' })
    for (const rotulo of [
      'Negrito',
      'Itálico',
      'Título 2',
      'Título 3',
      'Lista com marcador',
      'Lista numerada',
      'Link',
      'Desfazer',
      'Refazer',
    ]) {
      expect(within(barra).getByRole('button', { name: rotulo })).toBeInTheDocument()
    }
  })
})

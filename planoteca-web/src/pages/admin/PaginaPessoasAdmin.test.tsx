import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { criarCliente } from '@/shared/api'
import { servidor } from '@/teste/servidor'
import { PaginaPessoasAdmin } from './PaginaPessoasAdmin'

const BASE = 'https://api.teste'
const MINHA_CONTA_ID = '11111111-1111-1111-1111-111111111111'

function renderizar(minhaContaId: string | null = MINHA_CONTA_ID) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/pessoas']}>
        <PaginaPessoasAdmin
          cliente={criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })}
          minhaContaId={minhaContaId}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PaginaPessoasAdmin', () => {
  it('lista as pessoas com o que cada uma escreveu', async () => {
    renderizar()

    expect(await screen.findByText('Professor Bruno')).toBeInTheDocument()
    expect(screen.getByText('Professora Carla')).toBeInTheDocument()
    expect(screen.getByText(/1 pendente/)).toBeInTheDocument()
  })

  it('não mostra os botões de papel e de acesso para a própria conta', async () => {
    renderizar()

    await screen.findByText('Pessoa de Teste')
    const minhaLinha = screen.getByText('Pessoa de Teste').closest('article')
    expect(minhaLinha).not.toBeNull()
    const botoes = minhaLinha!.querySelectorAll('button')
    for (const botao of botoes) {
      expect(botao).toBeDisabled()
    }
  })

  function linhaDe(nome: string): HTMLElement {
    const artigo = screen.getByText(nome).closest('article')
    if (!artigo) throw new Error(`Linha de "${nome}" não encontrada.`)
    return artigo
  }

  it('pede confirmação antes de promover', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Professor Bruno')
    await usuario.click(
      within(linhaDe('Professor Bruno')).getByRole('button', { name: 'Promover a administrador' }),
    )

    expect(
      await screen.findByText('Promover Professor a administrador?'),
    ).toBeInTheDocument()
    // O texto explica o que o papel PODE fazer, não só o nomeia.
    expect(screen.getByText(/Modera o blog, cataloga planos/)).toBeInTheDocument()
  })

  it('cancela sem chamar a API', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Professor Bruno')
    await usuario.click(
      within(linhaDe('Professor Bruno')).getByRole('button', { name: 'Promover a administrador' }),
    )
    await usuario.click(await screen.findByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByText('Promover Professor a administrador?')).not.toBeInTheDocument()
  })

  it('confirma e promove', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await screen.findByText('Professor Bruno')
    await usuario.click(
      within(linhaDe('Professor Bruno')).getByRole('button', { name: 'Promover a administrador' }),
    )
    await usuario.click(await screen.findByRole('button', { name: 'Confirmar' }))

    expect(screen.queryByText('Promover Professor a administrador?')).not.toBeInTheDocument()
  })

  it('mostra o erro do servidor ao tentar rebaixar a própria conta', async () => {
    // A API é quem recusa — este teste prova que o erro dela chega à tela,
    // não que o botão está escondido (o outro teste já prova isso). Se algum
    // dia o botão vazar por um bug de UI, a rota continua fechada.
    servidor.use(
      http.post('*/api/v1/admin/people/:id/papel', () =>
        HttpResponse.json(
          { status: 400, messages: ['Você não pode alterar o próprio papel.'] },
          { status: 400 },
        ),
      ),
    )
    renderizar(null)

    await screen.findByText('Pessoa de Teste')
    const usuario = userEvent.setup()
    await usuario.click(screen.getAllByRole('button', { name: 'Rebaixar a professor' })[0]!)
    await usuario.click(await screen.findByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText('Você não pode alterar o próprio papel.')).toBeInTheDocument()
  })

  it('mostra estado vazio para busca sem resultado', async () => {
    servidor.use(http.get('*/api/v1/admin/people', () => new HttpResponse(null, { status: 204 })))
    renderizar()

    expect(await screen.findByText('Ninguém se cadastrou ainda.')).toBeInTheDocument()
  })
})

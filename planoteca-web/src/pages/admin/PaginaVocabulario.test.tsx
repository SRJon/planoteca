import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { criarCliente } from '@/shared/api'
import { COMPONENTE_INATIVO_FIXTURE } from '@/teste/planos'
import { servidor } from '@/teste/servidor'
import { PaginaVocabulario } from './PaginaVocabulario'

const BASE = 'https://api.teste'

function renderizar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/vocabulario']}>
        <PaginaVocabulario
          cliente={criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PaginaVocabulario', () => {
  it('mostra as três abas e começa em componentes', async () => {
    renderizar()

    expect(await screen.findByRole('button', { name: 'Componentes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Séries' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Metodologias' })).toBeInTheDocument()
    expect(await screen.findByText('Língua Portuguesa')).toBeInTheDocument()
  })

  it('troca de aba e mostra a lista daquele tipo', async () => {
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(await screen.findByRole('button', { name: 'Séries' }))

    expect(await screen.findByText('6º ano')).toBeInTheDocument()
  })

  it('mostra o item desativado com o estado à vista', async () => {
    renderizar()

    const linha = await screen.findByText('Filosofia')
    expect(within(linha.closest('article')!).getByText('Desativado')).toBeInTheDocument()
  })

  /**
   * O `PUT` substitui o item inteiro, então reativar reenvia todo campo —
   * inclusive os que a ação não altera.
   *
   * Enquanto o tipo `Componente` não trazia `ordem`, a tela mandava um `1`
   * fixo aqui, e cada desativação reescrevia a posição do componente sem
   * nada na interface dizer isso. O dano some do olho e fica no banco, que é
   * a pior forma de um defeito existir. Este teste é o que o impede de
   * voltar.
   */
  it('preserva a ordem ao reativar um componente', async () => {
    const usuario = userEvent.setup()
    let enviado: { ordem?: number; ativo?: boolean } | null = null

    servidor.use(
      http.put('*/api/v1/admin/vocabulary/components/:id', async ({ request }) => {
        enviado = (await request.json()) as { ordem: number; ativo: boolean }
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderizar()

    const linha = (await screen.findByText('Filosofia')).closest('article')!
    await usuario.click(within(linha).getByRole('button', { name: /reativar/i }))

    await waitFor(() => expect(enviado).not.toBeNull())
    expect(enviado!.ordem).toBe(COMPONENTE_INATIVO_FIXTURE.ordem)
    expect(enviado!.ativo).toBe(true)
  })

  /**
   * Desativar pergunta antes; reativar não.
   *
   * Desativar tira o item do filtro da Biblioteca inteira, e os planos que já
   * o citam ficam sem a opção que os encontra — o mesmo peso que
   * `PaginaPessoasAdmin` dá a desativar uma conta. Reativar devolve a opção,
   * e não tira nada de ninguém: perguntar ali seria só um clique a mais.
   */
  it('pergunta antes de desativar, e não desativa se cancelar', async () => {
    const usuario = userEvent.setup()
    let houvePut = false

    servidor.use(
      http.put('*/api/v1/admin/vocabulary/components/:id', () => {
        houvePut = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    renderizar()

    const linha = (await screen.findByText('Língua Portuguesa')).closest('article')!
    await usuario.click(within(linha).getByRole('button', { name: /desativar/i }))

    const confirmacao = await screen.findByRole('dialog')
    expect(within(confirmacao).getByText(/Língua Portuguesa/)).toBeInTheDocument()

    await usuario.click(within(confirmacao).getByRole('button', { name: 'Cancelar' }))

    expect(houvePut).toBe(false)
  })
})

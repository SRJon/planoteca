import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { servidor } from '@/teste/servidor'
import { criarCliente } from '@/shared/api'
import { PaginaPessoas } from './PaginaPessoas'

const BASE = 'https://api.teste'
const ROTA = `${BASE}/api/v1/person-samples`

/**
 * Item mínimo válido do corpo de `GET /person-samples`
 * (`PersonSampleDto`) — os sete campos que `paraDominio`
 * (`entities/pessoa/mapeador.ts`) exige/tolera. `mapeador.test.ts` já cobre
 * a tradução campo a campo; aqui só o suficiente para a tabela renderizar.
 */
function linha(overrides: Record<string, unknown> = {}) {
  return {
    id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
    firstName: 'Ana',
    lastName: 'Souza',
    dateBirth: '1990-04-12T00:00:00',
    type: 'FEMALE',
    active: true,
    age: 36,
    ...overrides,
  }
}

function renderizar(caminhoInicial = '/pessoas') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const cliente = criarCliente({ urlBase: BASE, lerToken: () => null, aoExpirar: () => {} })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[caminhoInicial]}>
        <PaginaPessoas cliente={cliente} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('PaginaPessoas', () => {
  it('lista o que a API devolve', async () => {
    servidor.use(
      http.get(ROTA, () =>
        HttpResponse.json([linha({ id: '1', firstName: 'Ana', lastName: 'Souza' })], {
          headers: { 'X-Total-Count': '1' },
        }),
      ),
    )

    renderizar()

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument()
  })

  it('mostra estado vazio quando a API devolve 204, sem erro no console', async () => {
    const erroConsole = vi.spyOn(console, 'error').mockImplementation(() => {})
    servidor.use(http.get(ROTA, () => new HttpResponse(null, { status: 204 })))

    renderizar()

    expect(await screen.findByText('Nenhuma pessoa encontrada')).toBeInTheDocument()
    expect(erroConsole).not.toHaveBeenCalled()
  })

  it('avança de página usando o total do X-Total-Count', async () => {
    const user = userEvent.setup()
    servidor.use(
      http.get(ROTA, ({ request }) => {
        const pagina = new URL(request.url).searchParams.get('page') ?? '1'
        const item =
          pagina === '2'
            ? linha({ id: '2', firstName: 'Bia', lastName: 'Lima' })
            : linha({ id: '1', firstName: 'Ana', lastName: 'Souza' })
        // total maior que `porPagina` (25, o padrão de `useFiltroPessoas`):
        // sem isto `temProximaPagina` fica falso e o botão "Próxima página"
        // nasce desabilitado — é exatamente o X-Total-Count que decide.
        return HttpResponse.json([item], { headers: { 'X-Total-Count': '26' } })
      }),
    )

    renderizar()
    await screen.findByText('Ana Souza')

    await user.click(screen.getByRole('button', { name: 'Próxima página' }))

    await waitFor(async () => {
      expect(await screen.findByText('Bia Lima')).toBeInTheDocument()
    })
  })
})

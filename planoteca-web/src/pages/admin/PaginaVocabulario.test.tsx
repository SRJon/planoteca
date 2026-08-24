import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { criarCliente } from '@/shared/api'
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
   * A tela NÃO manda `ordem`.
   *
   * A posição do item é calculada pela API no cadastro e preservada na
   * alteração. Enquanto ela veio do formulário, dois defeitos coexistiram:
   * cadastrar série com ordem já ocupada estourava a exceção crua do EF Core
   * (`serie.ordem` é UNIQUE), e reativar um componente reescrevia a posição
   * dele com um valor fixo. Mandar o campo de volta reabriria os dois.
   */
  it('não manda ordem ao reativar um componente', async () => {
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
    expect(enviado!).not.toHaveProperty('ordem')
    expect(enviado!.ativo).toBe(true)
  })

  /**
   * O erro de uma mutação não vaza para o diálogo seguinte.
   *
   * O `error` do TanStack Query sobrevive até a próxima mutação ou até um
   * `reset`. Sem isso, a falha ao cadastrar uma série reaparecia no
   * formulário de metodologia aberto em seguida, apontando para um problema
   * que não era daquela tela — foi assim que o defeito chegou relatado.
   */
  it('não mostra o erro anterior num diálogo novo', async () => {
    const usuario = userEvent.setup()

    servidor.use(
      http.post('*/api/v1/admin/vocabulary/grades', () =>
        HttpResponse.json({ status: 400, messages: ['Falha proposital.'] }, { status: 400 }),
      ),
    )

    renderizar()

    // Falha o cadastro de série, e confirma que a mensagem aparece.
    await usuario.click(await screen.findByRole('button', { name: 'Séries' }))
    await usuario.click(await screen.findByRole('button', { name: 'Cadastrar série' }))
    await usuario.type(screen.getByLabelText('Nome'), '5º ano')
    await usuario.type(screen.getByLabelText('Rótulo completo'), '5º ano do Fundamental')
    await usuario.type(screen.getByLabelText('Sigla'), '5º')
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha proposital.')

    // Fecha, e abre outro diálogo: o erro não pode estar lá.
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))
    await usuario.click(await screen.findByRole('button', { name: 'Metodologias' }))
    await usuario.click(await screen.findByRole('button', { name: 'Cadastrar metodologia' }))

    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).queryByRole('alert')).not.toBeInTheDocument()
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

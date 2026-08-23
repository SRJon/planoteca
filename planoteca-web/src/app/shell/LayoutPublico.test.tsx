import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ComAutenticacao, sessaoDeTeste } from '@/teste/autenticacao'
import { AcessibilidadeProvider } from '@/shared/acessibilidade'
import { TemaProvider } from '../providers/TemaProvider'
import { LayoutPublico } from './LayoutPublico'

function renderizar(
  sessao: Parameters<typeof ComAutenticacao>[0]['sessao'] = null,
  extra: { sair?: () => Promise<void> } = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <ComAutenticacao sessao={sessao} {...extra}>
        <TemaProvider>
          <AcessibilidadeProvider>
            <MemoryRouter initialEntries={['/biblioteca']}>
              <Routes>
                <Route element={<LayoutPublico />}>
                  <Route path="/biblioteca" element={<p>acervo</p>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AcessibilidadeProvider>
        </TemaProvider>
      </ComAutenticacao>
    </QueryClientProvider>,
  )
}

describe('LayoutPublico', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(cleanup)

  it('oferece a troca de tema a quem NÃO entrou', async () => {
    const usuario = userEvent.setup()
    renderizar()

    // O botão só existia no menu de conta da `BarraSuperior`, que não aparece
    // sem sessão. Como o tema inicial segue o sistema operacional, quem usa o
    // Windows no escuro abria a Biblioteca no escuro sem saída.
    const botao = screen.getByRole('button', { name: /Mudar para o tema/ })
    expect(botao).toBeInTheDocument()

    const eraEscuro = document.documentElement.classList.contains('dark')
    await usuario.click(botao)
    expect(document.documentElement.classList.contains('dark')).toBe(!eraEscuro)
  })

  it('a escolha sobrevive à recarga', async () => {
    const usuario = userEvent.setup()
    const { unmount } = renderizar()

    await usuario.click(screen.getByRole('button', { name: /Mudar para o tema/ }))
    const escolhido = document.documentElement.classList.contains('dark')

    unmount()
    cleanup()
    renderizar()

    // Sem persistência, a preferência do sistema voltaria a mandar na
    // próxima visita — e a pessoa trocaria o tema toda vez que abrisse.
    expect(document.documentElement.classList.contains('dark')).toBe(escolhido)
  })

  it('leva quem administra à moderação, e quem não administra ao blog', async () => {
    const usuario = userEvent.setup()

    // O botão apontava para `/biblioteca` — a própria página de onde ele é
    // clicado. Clicar não fazia nada.
    renderizar(sessaoDeTeste('administrador'))
    await usuario.click(screen.getByRole('button', { name: /Minha área/ }))
    expect(await screen.findByRole('menuitem', { name: 'Moderação' })).toHaveAttribute(
      'href',
      '/admin/moderacao',
    )

    cleanup()

    // Professor não vê a moderação: a API responde 403. Mandá-lo para lá
    // seria oferecer uma porta que bate na cara dele.
    renderizar(sessaoDeTeste('professor'))
    await usuario.click(screen.getByRole('button', { name: /Minha área/ }))
    expect(await screen.findByRole('menuitem', { name: 'Escrever para o blog' })).toHaveAttribute(
      'href',
      '/admin/escrever',
    )
  })

  it('deixa sair sem passar pelo painel', async () => {
    const usuario = userEvent.setup()
    const sair = vi.fn(async () => {})
    renderizar(sessaoDeTeste('administrador'), { sair })

    await usuario.click(screen.getByRole('button', { name: /Minha área/ }))
    await usuario.click(await screen.findByRole('menuitem', { name: /Sair/ }))

    // O botão de sair vivia só dentro do painel. Quem entrasse e ficasse no
    // acervo não tinha como encerrar a sessão sem limpar o navegador.
    expect(sair).toHaveBeenCalled()
  })

  it('quem não entrou vê o convite, não a mesa de trabalho', () => {
    renderizar(null)

    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar')
    expect(screen.queryByRole('button', { name: /Minha área/ })).not.toBeInTheDocument()
  })
})

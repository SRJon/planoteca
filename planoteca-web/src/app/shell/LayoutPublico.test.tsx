import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ComAutenticacao } from '@/teste/autenticacao'
import { TemaProvider } from '../providers/TemaProvider'
import { LayoutPublico } from './LayoutPublico'

function renderizar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <ComAutenticacao sessao={null}>
        <TemaProvider>
          <MemoryRouter initialEntries={['/biblioteca']}>
            <Routes>
              <Route element={<LayoutPublico />}>
                <Route path="/biblioteca" element={<p>acervo</p>} />
              </Route>
            </Routes>
          </MemoryRouter>
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
})

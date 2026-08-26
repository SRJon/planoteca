import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
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

  it('o rodapé leva às quatro áreas e ao contato', () => {
    renderizar()

    const rodape = screen.getByRole('contentinfo')

    // O único canal que existe de verdade. Sem telefone, sem rede social,
    // sem newsletter — link para o vazio é pior que ausência.
    expect(within(rodape).getByRole('link', { name: 'planoteca.escola@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:planoteca.escola@gmail.com',
    )

    const destinos: Array<[string, string]> = [
      ['Início', '/'],
      ['Biblioteca', '/biblioteca'],
      ['Blog', '/blog'],
      ['Entrar', '/entrar'],
    ]
    for (const [nome, rota] of destinos) {
      expect(within(rodape).getByRole('link', { name: nome })).toHaveAttribute('href', rota)
    }
  })

  it('o rodapé antigo de uma linha some', () => {
    renderizar()

    // A frase corria solta num `<div>` de uma linha só. Ela virou a
    // descrição da coluna da marca; o texto avulso não deve sobrar.
    expect(
      screen.queryByText(/Planoteca — acervo de planos de aula com metodologias ativas/),
    ).not.toBeInTheDocument()
  })

  it('quem não entrou vê o convite, não a mesa de trabalho', () => {
    renderizar(null)

    // Escopado à barra superior: o rodapé também leva a `/entrar`, e sem
    // recorte a busca acha os dois.
    const barra = screen.getByRole('banner')
    expect(within(barra).getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar')
    expect(screen.queryByRole('button', { name: /Minha área/ })).not.toBeInTheDocument()
  })
})

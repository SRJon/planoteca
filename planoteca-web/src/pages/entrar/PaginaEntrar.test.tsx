import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { PaginaEntrar } from './PaginaEntrar'
import type { PaginaEntrarProps } from './PaginaEntrar'

function renderizar(sobrescreve: Partial<PaginaEntrarProps> = {}) {
  const props: PaginaEntrarProps = {
    temSessao: false,
    carregando: false,
    disponivel: true,
    entrarComGoogle: vi.fn(async () => {}),
    entrarComSenha: vi.fn(async () => {}),
    cadastrarComSenha: vi.fn(async () => {}),
    ...sobrescreve,
  }

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  const utilitarios = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/entrar']}>
        <Routes>
          <Route path="/entrar" element={<PaginaEntrar {...props} />} />
          <Route path="/admin/moderacao" element={<p>área de trabalho</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )

  return { ...utilitarios, valor: props }
}

describe('PaginaEntrar', () => {
  it('oferece o Google e o formulário de e-mail', async () => {
    renderizar()

    expect(await screen.findByRole('heading', { name: 'Entrar', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar com o Google/ })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('tem saída para a Biblioteca — quem chegou aqui por engano não fica preso', () => {
    renderizar()

    // Nenhum professor precisa desta tela para baixar um plano. A saída não
    // é cortesia: é a decisão de produto aparecendo na interface.
    expect(screen.getByRole('link', { name: 'Ver a Biblioteca sem entrar' })).toHaveAttribute(
      'href',
      '/biblioteca',
    )
  })

  it('entra com e-mail e senha', async () => {
    const usuario = userEvent.setup()
    const { valor } = renderizar()

    await usuario.type(screen.getByLabelText('E-mail'), 'ana@escola.test')
    await usuario.type(screen.getByLabelText('Senha'), 'senha-secreta')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(valor.entrarComSenha).toHaveBeenCalledWith('ana@escola.test', 'senha-secreta')
  })

  it('alterna para o cadastro e pede o nome', async () => {
    const usuario = userEvent.setup()
    const { valor } = renderizar()

    await usuario.click(screen.getByRole('button', { name: /Não tem conta/ }))

    // O nome só aparece no cadastro: no login ele não serve para nada, e um
    // campo a mais é uma pergunta a mais para quem só quer entrar.
    await usuario.type(screen.getByLabelText('Nome'), 'Ana Ribeiro')
    await usuario.type(screen.getByLabelText('E-mail'), 'ana@escola.test')
    await usuario.type(screen.getByLabelText('Senha'), 'senha-nova')
    await usuario.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(valor.cadastrarComSenha).toHaveBeenCalledWith(
      'Ana Ribeiro',
      'ana@escola.test',
      'senha-nova',
    )
  })

  it('traduz o erro do Firebase em vez de mostrar o código', async () => {
    const usuario = userEvent.setup()
    renderizar({
      entrarComSenha: vi.fn(async () => {
        throw Object.assign(new Error('firebase'), { code: 'auth/invalid-credential' })
      }),
    })

    await usuario.type(screen.getByLabelText('E-mail'), 'ana@escola.test')
    await usuario.type(screen.getByLabelText('Senha'), 'errada')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    // "auth/invalid-credential" na tela seria despejar detalhe de
    // implementação em quem só quer entrar.
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
  })

  it('não trata janela fechada como erro', async () => {
    const usuario = userEvent.setup()
    renderizar({
      entrarComGoogle: vi.fn(async () => {
        throw Object.assign(new Error('popup'), { code: 'auth/popup-closed-by-user' })
      }),
    })

    await usuario.click(screen.getByRole('button', { name: /Continuar com o Google/ }))

    // Fechar a janela do Google é desistência, não falha. Um alerta vermelho
    // para quem só mudou de ideia é hostil.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('avisa quando o login não está configurado, sem oferecer botão morto', () => {
    renderizar({ disponivel: false })

    expect(screen.getByRole('alert')).toHaveTextContent('VITE_FIREBASE')
    expect(screen.queryByRole('button', { name: /Continuar com o Google/ })).not.toBeInTheDocument()
    // A saída para a Biblioteca permanece: sem login, o acervo continua de pé.
    expect(screen.getByRole('link', { name: 'Ver a Biblioteca sem entrar' })).toBeInTheDocument()
  })

  it('quem já entrou não vê a tela de entrar', async () => {
    renderizar({ temSessao: true })

    expect(await screen.findByText('área de trabalho')).toBeInTheDocument()
  })
})

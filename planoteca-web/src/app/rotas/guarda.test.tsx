import { describe, expect, it } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { Sessao } from '@/entities/autenticacao'
import { ComAutenticacao } from '@/teste/autenticacao'
import { TemaProvider } from '../providers/TemaProvider'
import { Rotas } from './Rotas'

function renderizar(
  caminho: string,
  opcoes: { sessao?: Sessao | null; carregando?: boolean } = {},
) {
  // `retry: false`: por padrão o TanStack Query tenta de novo 3 vezes com
  // backoff a cada falha — bom para produção, ruído aqui.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <ComAutenticacao sessao={opcoes.sessao ?? null} carregando={opcoes.carregando ?? false}>
      <QueryClientProvider client={queryClient}>
        <TemaProvider>
          <MemoryRouter initialEntries={[caminho]}>
            <Rotas />
          </MemoryRouter>
        </TemaProvider>
      </QueryClientProvider>
    </ComAutenticacao>,
  )
}

describe('o acervo é público', () => {
  // Estes testes travam uma DECISÃO DE PRODUTO, não um detalhe de
  // roteamento: baixar um plano não pode exigir conta. Se um deles começar a
  // falhar porque alguém pôs a Biblioteca atrás da guarda, o teste está
  // certo e a mudança está errada — confira o `CLAUDE.md` da raiz antes de
  // ajustar a expectativa.

  it('sem sessão, a raiz abre a landing e não o login', async () => {
    renderizar('/')

    expect(
      await screen.findByRole('heading', { name: /plano de aula pronto/i }),
    ).toBeInTheDocument()
  })

  it('sem sessão, a Biblioteca abre normalmente', async () => {
    renderizar('/biblioteca')

    expect(await screen.findByRole('heading', { name: 'Biblioteca' })).toBeInTheDocument()
  })

  it('sem sessão, o Blog abre e lista os textos publicados', async () => {
    renderizar('/blog')

    expect(await screen.findByRole('heading', { name: 'Blog', level: 1 })).toBeInTheDocument()
    expect(await screen.findByText('Escape Room na aula de Química')).toBeInTheDocument()
  })

  it('uma rota desconhecida cai na landing, não no login', async () => {
    renderizar('/rota-que-nao-existe')

    expect(
      await screen.findByRole('heading', { name: /plano de aula pronto/i }),
    ).toBeInTheDocument()
  })
})

describe('guarda de rota', () => {
  it('sem sessão, uma rota da área de trabalho cai em /entrar', async () => {
    renderizar('/admin/moderacao')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('ESPERA enquanto o Firebase ainda não respondeu', async () => {
    // O caso que uma guarda ingênua erra: no primeiro render de toda visita
    // não há sessão ainda, porque o SDK lê o armazenamento de forma
    // assíncrona. Redirecionar aqui expulsaria quem ESTÁ logado.
    renderizar('/admin/moderacao', { carregando: true })

    expect(await screen.findByText('Verificando o acesso…')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Entrar' })).not.toBeInTheDocument()
  })

  it('com sessão, a rota da área de trabalho abre', async () => {
    renderizar('/admin/moderacao', { sessao: { ...sessaoAdmin() } })

    expect(
      await screen.findByRole('heading', { name: 'Moderação do blog', level: 1 }),
    ).toBeInTheDocument()
  })
})

function sessaoAdmin(): Sessao {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@escola.test',
    nome: 'Admin de Teste',
    papel: 'administrador',
    ativo: true,
    novo: false,
  }
}

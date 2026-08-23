import type { Page, Route } from '@playwright/test'
import {
  POSTS_FIXTURE,
  VOCABULARIO_FIXTURE,
  detalharPlano,
  filtrarPosts,
  gerarPlanos,
  paginarPlanos,
} from '../src/teste/planos'
import type { PlanoFixture } from '../src/teste/planos'

/**
 * Simulação de rede para o caminho ponta a ponta (Task 10 do boilerplate).
 *
 * A API real está desligada e continua desligada — nenhum spec desta pasta
 * pode depender dela no ar. `instalarSimulacao` intercepta TODA chamada
 * `**\/api/v1/**` antes de sair do navegador (`page.route`), com um roteador
 * único: as três rotas que o caminho feliz percorre (login, userinfo,
 * person-samples) respondem com dado fabricado aqui; qualquer rota fora
 * dessa lista devolve 501 com uma mensagem que nomeia o método e o caminho
 * não simulados — uma falha de asserção legível, nunca uma chamada real
 * pendurada contra um host que não resolve.
 */

export const USUARIO_VALIDO = 'joao.silva'
export const SENHA_VALIDA = 'segredo-forte-123'

/** A sessão que `GET /auth/me` devolve nos testes. */
export const SESSAO_ADMIN = {
  id: '66666666-6666-6666-6666-666666666666',
  email: 'admin@escola.test',
  nome: 'Admin de Teste',
  papel: 'administrador',
  ativo: true,
  novo: false,
}

/**
 * Entra como administrador, sem passar pelo Firebase.
 *
 * ── Por que não simular o SDK ────────────────────────────────────────────
 *
 * O login acontece no NAVEGADOR, contra os servidores do Google. Simular o
 * SDK inteiro no Playwright testaria o mock, não a aplicação — e exigiria
 * reimplementar `onIdTokenChanged`, persistência e renovação, que é
 * justamente a parte que o Firebase existe para resolver.
 *
 * O que estes testes precisam provar é o que vem DEPOIS do login: que o
 * painel abre, que o menu mostra o que deve, que a moderação funciona.
 * Injetar a sessão os deixa focados nisso.
 *
 * O caminho real do login — botão do Google, formulário de e-mail, tradução
 * de erro — é coberto por `src/pages/entrar/PaginaEntrar.test.tsx`.
 */
export async function entrarComoAdministrador(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // O provedor lê isto na inicialização quando o Firebase está ausente.
    ;(window as unknown as Record<string, unknown>).__PLANOTECA_SESSAO_TESTE__ = true
  })
}

const GRUPO_PADRAO = 'financeiro'

export interface PessoaFixture {
  id: string
  firstName: string
  lastName?: string
  dateBirth: string
  type: 'MALE' | 'FEMALE'
  active: boolean
  age: number
}

/** Gera `quantidade` pessoas determinísticas. `firstName`/`lastName` seguem
 * um índice, o que dá à busca livre um alvo previsível de testar. O total
 * default (26) é de propósito MAIOR que o tamanho de página (25,
 * `TAMANHOS_PAGINA` em `useFiltroPessoas.ts`): um total menor deixaria o
 * botão "Próxima página" desabilitado e o teste de paginação passaria sem
 * provar nada sobre o `X-Total-Count`. */
export function gerarPessoas(quantidade = 26): PessoaFixture[] {
  return Array.from({ length: quantidade }, (_, indice) => {
    const numero = indice + 1
    return {
      id: `00000000-0000-0000-0000-${String(numero).padStart(12, '0')}`,
      firstName: `Pessoa${String(numero).padStart(3, '0')}`,
      lastName: 'Exemplo',
      dateBirth: '1990-04-12T00:00:00',
      type: numero % 2 === 0 ? 'MALE' : 'FEMALE',
      active: numero % 5 !== 0,
      age: 20 + (numero % 40),
    }
  })
}

function paginar(
  url: URL,
  todos: PessoaFixture[],
): { itens: PessoaFixture[]; total: number } {
  const filtro = (url.searchParams.get('filter') ?? '').toLowerCase()
  const pagina = Number(url.searchParams.get('page') ?? '1')
  const porPagina = Number(url.searchParams.get('per_page') ?? '25')
  const ativoParam = url.searchParams.get('active')

  let filtrados = filtro
    ? todos.filter(
        (p) =>
          p.firstName.toLowerCase().includes(filtro) ||
          (p.lastName ?? '').toLowerCase().includes(filtro),
      )
    : todos

  if (ativoParam !== null) {
    const ativo = ativoParam === 'true'
    filtrados = filtrados.filter((p) => p.active === ativo)
  }

  const sort = url.searchParams.get('sort')
  if (sort) {
    const descendente = sort.startsWith('-')
    const campo = descendente ? sort.slice(1) : sort
    const chave = campo === 'FirstName' ? 'firstName' : campo === 'LastName' ? 'lastName' : null
    if (chave) {
      filtrados = [...filtrados].sort((a, b) => {
        const valorA = a[chave] ?? ''
        const valorB = b[chave] ?? ''
        const comparacao = valorA.localeCompare(valorB)
        return descendente ? -comparacao : comparacao
      })
    }
  }

  const inicio = (pagina - 1) * porPagina
  return { itens: filtrados.slice(inicio, inicio + porPagina), total: filtrados.length }
}

async function json(route: Route, status: number, corpo: unknown, cabecalhos: Record<string, string> = {}) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: cabecalhos,
    body: JSON.stringify(corpo),
  })
}

export interface OpcoesSimulacao {
  /** Token já pronto — pula o padrão fabricado por `instalarSimulacao`.
   * Usado por specs que só precisam de uma sessão já autenticada (sem
   * passar pela tela de login). O token é OPACO: qualquer string serve, o
   * front nunca a decodifica (RF-05). */
  token?: string
  quantidadePessoas?: number
  quantidadePlanos?: number
}

export interface SimulacaoInstalada {
  token: string
  pessoas: PessoaFixture[]
  planos: PlanoFixture[]
}

/**
 * Registra o roteador único desta suíte. Precisa ser chamado ANTES de
 * qualquer `page.goto`/interação que dispare a primeira requisição —
 * Playwright intercepta a partir do registro, não retroativamente.
 */
export async function instalarSimulacao(page: Page, opcoes: OpcoesSimulacao = {}): Promise<SimulacaoInstalada> {
  const token = opcoes.token ?? 'token-opaco-de-teste'
  const pessoas = gerarPessoas(opcoes.quantidadePessoas ?? 26)
  const planos = gerarPlanos(opcoes.quantidadePlanos ?? 14)

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const caminho = url.pathname.startsWith('/api/v1') ? url.pathname.slice('/api/v1'.length) : url.pathname
    const metodo = request.method()

    if (metodo === 'POST' && caminho === '/auth/login') {
      const corpo = request.postDataJSON() as { name?: unknown; password?: unknown }
      if (corpo.name === USUARIO_VALIDO && corpo.password === SENHA_VALIDA) {
        await json(route, 200, {
          access_token: token,
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'refresh-de-teste',
          id_token: 'id-de-teste',
        })
      } else {
        await json(route, 400, { status: 400, messages: ['Usuário ou senha inválidos.'] })
      }
      return
    }

    if (metodo === 'GET' && caminho === '/auth/userinfo') {
      await json(route, 200, {
        sub: USUARIO_VALIDO,
        mail: 'joao.silva@exemplo.com',
        locationCountry: 'BR',
        firstName: 'João',
        cn: 'João da Silva',
        sn: 'Silva',
        employeeID: '12345',
        groupMembership: [GRUPO_PADRAO],
        userFullName: 'João da Silva',
      })
      return
    }

    if (metodo === 'GET' && caminho === '/person-samples') {
      const { itens, total } = paginar(url, pessoas)
      if (total === 0) {
        await route.fulfill({ status: 204, headers: { 'X-Total-Count': '0' } })
      } else {
        await json(route, 200, itens, { 'X-Total-Count': String(total) })
      }
      return
    }

    if (metodo === 'GET' && caminho === '/lesson-plans') {
      const { itens, total } = paginarPlanos(url.searchParams, planos)
      if (total === 0) {
        await route.fulfill({ status: 204, headers: { 'X-Total-Count': '0' } })
      } else {
        await json(route, 200, itens, { 'X-Total-Count': String(total) })
      }
      return
    }

    const fichaPlano = caminho.match(/^\/lesson-plans\/([0-9a-f-]+)$/i)
    if (metodo === 'GET' && fichaPlano) {
      const plano = planos.find((p) => p.id === fichaPlano[1])
      if (!plano) {
        await json(route, 404, { status: 404, messages: ['Plano não encontrado.'] })
      } else {
        await json(route, 200, detalharPlano(plano))
      }
      return
    }

    // ── Blog ─────────────────────────────────────────────────────────────
    const fichaPost = caminho.match(/^\/posts\/([0-9a-f-]+)$/i)
    if (metodo === 'GET' && fichaPost) {
      const post = POSTS_FIXTURE.find(
        (p) => p.id === fichaPost[1] && p.situacao === 'publicado',
      )
      if (!post) {
        await json(route, 404, { status: 404, messages: ['Texto não encontrado.'] })
      } else {
        await json(route, 200, post)
      }
      return
    }

    if (metodo === 'GET' && caminho === '/posts') {
      const { itens, total } = filtrarPosts(url.searchParams, POSTS_FIXTURE)
      if (total === 0) {
        await route.fulfill({ status: 204, headers: { 'X-Total-Count': '0' } })
      } else {
        await json(route, 200, itens, { 'X-Total-Count': String(total) })
      }
      return
    }

    if (metodo === 'GET' && caminho === '/admin/posts/pendentes/contagem') {
      await json(route, 200, {
        total: POSTS_FIXTURE.filter((p) => p.situacao === 'pendente').length,
      })
      return
    }

    const fichaPostAdmin = caminho.match(/^\/admin\/posts\/([0-9a-f-]+)$/i)
    if (metodo === 'GET' && fichaPostAdmin) {
      const post = POSTS_FIXTURE.find((p) => p.id === fichaPostAdmin[1])
      if (!post) {
        await json(route, 404, { status: 404, messages: ['Texto não encontrado.'] })
      } else {
        await json(route, 200, post)
      }
      return
    }

    if (metodo === 'GET' && caminho === '/admin/posts') {
      // Padrão `pendente`, como o controller admin faz.
      const { itens, total } = filtrarPosts(url.searchParams, POSTS_FIXTURE, 'pendente')
      if (total === 0) {
        await route.fulfill({ status: 204, headers: { 'X-Total-Count': '0' } })
      } else {
        await json(route, 200, itens, { 'X-Total-Count': String(total) })
      }
      return
    }

    if (metodo === 'POST' && caminho === '/admin/posts') {
      await json(route, 201, { id: '70000000-0000-0000-0000-000000000900' })
      return
    }

    const moderacao = caminho.match(/^\/admin\/posts\/([0-9a-f-]+)\/moderacao$/i)
    if (metodo === 'POST' && moderacao) {
      const corpo = JSON.parse(route.request().postData() ?? '{}')
      // RF-11: devolver ou recusar exige o motivo.
      if (corpo.situacao !== 'publicado' && !corpo.comentario?.trim()) {
        await json(route, 400, {
          status: 400,
          messages: ['Diga ao autor por que o texto foi devolvido ou recusado.'],
        })
      } else {
        await route.fulfill({ status: 204 })
      }
      return
    }

    // ── Gestão de planos ─────────────────────────────────────────────────
    if (metodo === 'GET' && caminho === '/admin/lesson-plans') {
      const { itens, total } = paginarPlanos(url.searchParams, planos)
      if (total === 0) {
        await route.fulfill({ status: 204, headers: { 'X-Total-Count': '0' } })
      } else {
        await json(
          route,
          200,
          itens.map((p) => ({ ...p, situacao: 'publicado' })),
          { 'X-Total-Count': String(total) },
        )
      }
      return
    }

    // A sessão da Planoteca. O front chama esta rota com o token do
    // Firebase; aqui ela responde direto, porque o Firebase não roda em
    // teste — ver `entrarComoAdministrador` abaixo.
    if (metodo === 'GET' && caminho === '/auth/me') {
      await json(route, 200, SESSAO_ADMIN)
      return
    }

    if (metodo === 'GET' && caminho === '/vocabulary') {
      // Os chips do filtro saem daqui. Sem este handler a Biblioteca desenha
      // sem nenhum chip, e o teste de filtro falha por não achar o botão.
      await json(route, 200, VOCABULARIO_FIXTURE)
      return
    }

    await json(route, 501, { messages: [`Rota não simulada em e2e/simulacao.ts: ${metodo} ${caminho}`] })
  })

  return { token, pessoas, planos }
}

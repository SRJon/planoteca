import { setupServer } from 'msw/node'
import { HttpResponse, http } from 'msw'
import {
  CONTAS_FIXTURE,
  POSTS_FIXTURE,
  VOCABULARIO_ADMIN_FIXTURE,
  VOCABULARIO_FIXTURE,
  detalharPlano,
  filtrarContas,
  filtrarPosts,
  gerarPlanos,
  paginarPlanos,
} from './planos'

/**
 * Uma pessoa de exemplo para o handler padrão de `GET /person-samples`
 * abaixo — só o suficiente para uma tela que monta `PaginaPessoas` sem
 * declarar o próprio `servidor.use(...)` ver dado em vez de erro de rota
 * não simulada (`onUnhandledRequest: 'error'`, `src/teste/preparo.ts`).
 * Testes que precisam de um cenário específico (204, paginação, erro)
 * sobrescrevem com `servidor.use(...)`, como `PaginaPessoas.test.tsx` faz.
 */
const PESSOA_PADRAO = {
  id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
  firstName: 'Ana',
  lastName: 'Souza',
  dateBirth: '1990-04-12T00:00:00',
  type: 'FEMALE',
  active: true,
  age: 36,
}

/**
 * A simulação de rede para os testes de unidade/integração (Vitest + MSW).
 * Distinta de `e2e/simulacao.ts` (Playwright, servidor de verdade
 * intermediado) — os dois cobrem o mesmo contrato, por camadas diferentes.
 *
 * O handler abaixo cobre a ARMADILHA do `X-Total-Count`: o cabeçalho, não
 * o corpo, é de onde `cliente.listar` (`shared/api/cliente.ts`) tira o
 * total — um handler que "esquecesse" o cabeçalho deixaria a paginação
 * quebrada em qualquer teste que dependesse só deste default.
 */
const PLANOS_PADRAO = gerarPlanos()

/** Os quatro tokens que a API aceita (RF-04) — espelha `CorComponente.cs`.
 * Só para a simulação recusar cor inválida como o back-end recusaria. */
const CORES_VALIDAS = ['comp-linguagens', 'comp-matematica', 'comp-natureza', 'comp-humanas']

export const servidor = setupServer(
  http.get('*/api/v1/person-samples', () =>
    HttpResponse.json([PESSOA_PADRAO], { headers: { 'X-Total-Count': '1' } }),
  ),
  // A biblioteca de planos. O handler aplica busca, recorte e paginação de
  // verdade (`src/teste/planos.ts`, compartilhado com o e2e) em vez de
  // devolver sempre a mesma lista: uma tela cujo modo de uso É filtrar
  // precisa de uma simulação que reaja ao filtro, senão o teste de filtro
  // passaria contra um handler que ignora a querystring.
  http.get('*/api/v1/lesson-plans', ({ request }) => {
    const { itens, total } = paginarPlanos(new URL(request.url).searchParams, PLANOS_PADRAO)
    if (total === 0) return new HttpResponse(null, { status: 204 })
    return HttpResponse.json(itens, { headers: { 'X-Total-Count': String(total) } })
  }),
  // O vocabulário que alimenta os chips do filtro. Sem este handler a
  // Biblioteca renderiza sem nenhum chip, e todo teste de filtro falharia
  // por não achar o botão — um sintoma que não aponta para a causa.
  http.get('*/api/v1/vocabulary', () => HttpResponse.json(VOCABULARIO_FIXTURE)),
  // A ficha de um plano. 404 para id desconhecido — é o que a API faz, tanto
  // para plano inexistente quanto para rascunho.
  // A catalogação. O upload é simulado por completo: o teste não sobe nada
  // para lugar nenhum, e a URL assinada aponta para um domínio que o próprio
  // MSW intercepta abaixo.
  http.post('*/api/v1/admin/lesson-plans/upload-url', async ({ request }) => {
    const corpo = (await request.json()) as { nomeArquivo: string; tipoConteudo: string }
    if (corpo.tipoConteudo !== 'application/pdf') {
      return HttpResponse.json(
        { status: 400, messages: [`Tipo de arquivo não aceito: ${corpo.tipoConteudo}.`] },
        { status: 400 },
      )
    }
    return HttpResponse.json({
      urlUpload: 'https://r2.teste/upload-assinado',
      urlPublica: `https://arquivos.teste/planos/${corpo.nomeArquivo}`,
      chave: `planos/${corpo.nomeArquivo}`,
      expiraEm: '2030-01-01T00:00:00Z',
    })
  }),
  // O `PUT` que o navegador faz DIRETO para o R2, sem passar pela API.
  http.put('https://r2.teste/upload-assinado', () => new HttpResponse(null, { status: 200 })),
  http.post('*/api/v1/admin/lesson-plans', async ({ request }) => {
    const entrada = (await request.json()) as { componentePrincipalId?: string; seriesIds?: string[] }
    if (!entrada.componentePrincipalId) {
      return HttpResponse.json(
        { status: 400, messages: ['Escolha o componente curricular principal.'] },
        { status: 400 },
      )
    }
    if (!entrada.seriesIds?.length) {
      return HttpResponse.json(
        { status: 400, messages: ['Escolha ao menos uma série.'] },
        { status: 400 },
      )
    }
    return HttpResponse.json({ id: '10000000-0000-0000-0000-000000000900' }, { status: 201 })
  }),
  // ── Blog ───────────────────────────────────────────────────────────────
  // A listagem pública só devolve publicados; a admin aceita `situacao`.
  http.get('*/api/v1/posts', ({ request }) => {
    const { itens, total } = filtrarPosts(new URL(request.url).searchParams, POSTS_FIXTURE)
    if (total === 0) return new HttpResponse(null, { status: 204 })
    return HttpResponse.json(itens, { headers: { 'X-Total-Count': String(total) } })
  }),
  http.get('*/api/v1/posts/:id', ({ params }) => {
    const post = POSTS_FIXTURE.find((p) => p.id === params['id'] && p.situacao === 'publicado')
    if (!post) {
      return HttpResponse.json({ status: 404, messages: ['Texto não encontrado.'] }, { status: 404 })
    }
    return HttpResponse.json(post)
  }),
  http.get('*/api/v1/admin/posts/pendentes/contagem', () =>
    HttpResponse.json({ total: POSTS_FIXTURE.filter((p) => p.situacao === 'pendente').length }),
  ),
  http.get('*/api/v1/admin/posts/:id', ({ params }) => {
    const post = POSTS_FIXTURE.find((p) => p.id === params['id'])
    if (!post) {
      return HttpResponse.json({ status: 404, messages: ['Texto não encontrado.'] }, { status: 404 })
    }
    return HttpResponse.json(post)
  }),
  http.get('*/api/v1/admin/posts', ({ request }) => {
    // Padrão `pendente`, como o controller admin faz.
    const { itens, total } = filtrarPosts(
      new URL(request.url).searchParams,
      POSTS_FIXTURE,
      'pendente',
    )
    if (total === 0) return new HttpResponse(null, { status: 204 })
    return HttpResponse.json(itens, { headers: { 'X-Total-Count': String(total) } })
  }),
  http.post('*/api/v1/admin/posts', () =>
    HttpResponse.json({ id: '70000000-0000-0000-0000-000000000900' }, { status: 201 }),
  ),
  http.post('*/api/v1/admin/posts/:id/moderacao', async ({ request }) => {
    const corpo = (await request.json()) as { situacao: string; comentario?: string }
    // RF-11: devolver ou recusar exige o motivo.
    if (corpo.situacao !== 'publicado' && !corpo.comentario?.trim()) {
      return HttpResponse.json(
        { status: 400, messages: ['Diga ao autor por que o texto foi devolvido ou recusado.'] },
        { status: 400 },
      )
    }
    return new HttpResponse(null, { status: 204 })
  }),
  // Arquivar não exige comentário — curadoria do acervo, não devolutiva ao autor.
  http.post('*/api/v1/admin/posts/:id/arquivamento', () => new HttpResponse(null, { status: 204 })),
  http.delete('*/api/v1/admin/posts/:id/arquivamento', () => new HttpResponse(null, { status: 204 })),
  // O incremento de visualização: público, anônimo, sempre 204.
  http.post('*/api/v1/posts/:id/visualizacao', () => new HttpResponse(null, { status: 204 })),
  // ── Gestão de planos ───────────────────────────────────────────────────
  http.get('*/api/v1/admin/lesson-plans', ({ request }) => {
    const { itens, total } = paginarPlanos(new URL(request.url).searchParams, PLANOS_PADRAO)
    if (total === 0) return new HttpResponse(null, { status: 204 })
    return HttpResponse.json(
      itens.map((p) => ({ ...p, situacao: 'publicado' })),
      { headers: { 'X-Total-Count': String(total) } },
    )
  }),
  http.post('*/api/v1/admin/lesson-plans/:id/situacao', () => new HttpResponse(null, { status: 204 })),
  http.delete('*/api/v1/admin/lesson-plans/:id', () =>
    HttpResponse.json(
      { status: 400, messages: ['Este plano está publicado e pode ter sido compartilhado. Despublique antes de remover.'] },
      { status: 400 },
    ),
  ),
  http.get('*/api/v1/lesson-plans/:id', ({ params }) => {
    const plano = PLANOS_PADRAO.find((p) => p.id === params['id'])
    if (!plano) return HttpResponse.json({ status: 404, messages: ['Plano não encontrado.'] }, { status: 404 })
    return HttpResponse.json(detalharPlano(plano))
  }),
  // ── Painel de pessoas ──────────────────────────────────────────────────
  // O primeiro item tem o MESMO id de `sessaoDeTeste()` — é assim que um
  // teste exercita "a própria conta aparece na lista, e a ação de papel e a
  // de acesso ficam desabilitadas para ela".
  http.get('*/api/v1/admin/people', ({ request }) => {
    const { itens, total } = filtrarContas(new URL(request.url).searchParams, CONTAS_FIXTURE)
    if (total === 0) return new HttpResponse(null, { status: 204 })
    return HttpResponse.json(itens, { headers: { 'X-Total-Count': String(total) } })
  }),
  http.post('*/api/v1/admin/people/:id/papel', ({ params }) => {
    if (params['id'] === '11111111-1111-1111-1111-111111111111') {
      return HttpResponse.json(
        { status: 400, messages: ['Você não pode alterar o próprio papel.'] },
        { status: 400 },
      )
    }
    return new HttpResponse(null, { status: 204 })
  }),
  http.post('*/api/v1/admin/people/:id/ativo', ({ params }) => {
    if (params['id'] === '11111111-1111-1111-1111-111111111111') {
      return HttpResponse.json(
        { status: 400, messages: ['Você não pode alterar o próprio acesso.'] },
        { status: 400 },
      )
    }
    return new HttpResponse(null, { status: 204 })
  }),
  // ── Gestão de vocabulário ──────────────────────────────────────────────
  // A leitura administrativa (RF-03): as mesmas três listas da rota pública,
  // com o inativo à vista.
  http.get('*/api/v1/admin/vocabulary', () => HttpResponse.json(VOCABULARIO_ADMIN_FIXTURE)),
  http.post('*/api/v1/admin/vocabulary/components', async ({ request }) => {
    const entrada = (await request.json()) as { nome?: string; cor?: string }
    if (!entrada.nome?.trim()) {
      return HttpResponse.json({ status: 400, messages: ['O nome é obrigatório.'] }, { status: 400 })
    }
    if (!CORES_VALIDAS.includes(entrada.cor ?? '')) {
      return HttpResponse.json(
        { status: 400, messages: ['A cor precisa ser um token que o tema conhece.'] },
        { status: 400 },
      )
    }
    return HttpResponse.json(
      { id: '20000000-0000-0000-0000-000000000900', ...entrada },
      { status: 201 },
    )
  }),
  http.put('*/api/v1/admin/vocabulary/components/:id', () => new HttpResponse(null, { status: 204 })),
  http.post('*/api/v1/admin/vocabulary/grades', async ({ request }) => {
    const entrada = (await request.json()) as { nome?: string }
    if (!entrada.nome?.trim()) {
      return HttpResponse.json({ status: 400, messages: ['O nome é obrigatório.'] }, { status: 400 })
    }
    return HttpResponse.json(
      { id: '30000000-0000-0000-0000-000000000900', ...entrada },
      { status: 201 },
    )
  }),
  http.put('*/api/v1/admin/vocabulary/grades/:id', () => new HttpResponse(null, { status: 204 })),
  http.post('*/api/v1/admin/vocabulary/methodologies', async ({ request }) => {
    const entrada = (await request.json()) as { nome?: string }
    if (!entrada.nome?.trim()) {
      return HttpResponse.json({ status: 400, messages: ['O nome é obrigatório.'] }, { status: 400 })
    }
    return HttpResponse.json(
      { id: '40000000-0000-0000-0000-000000000900', ...entrada },
      { status: 201 },
    )
  }),
  http.put('*/api/v1/admin/vocabulary/methodologies/:id', () => new HttpResponse(null, { status: 204 })),
)

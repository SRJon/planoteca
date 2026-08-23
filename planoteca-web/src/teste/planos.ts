/**
 * Fixture de planos e do vocabulário — compartilhada pela simulação de
 * unidade (MSW, `src/teste/servidor.ts`) e pela de ponta a ponta
 * (Playwright, `e2e/simulacao.ts`).
 *
 * Fica em `src/teste/` e não em `e2e/` porque as duas suítes precisam do
 * MESMO dado: duas fixtures paralelas divergiriam, e o teste de unidade
 * passaria a provar um contrato que o e2e não exercita.
 *
 * O formato é o da API — que desde 2026-08-22 é IGUAL ao domínio, em
 * camelCase e em português. Não há mais tradução de fio a exercitar: o
 * vocabulário virou tabela no banco, e componente e série viajam como
 * objeto com `id`, `sigla` e `cor`, não como chave em inglês.
 */

export interface ComponenteFixture {
  id: string
  nome: string
  area: string
  sigla: string
  cor: string
}

export interface SerieFixture {
  id: string
  nome: string
  rotuloCompleto: string
  sigla: string
  etapa: string
  ordem: number
}

export interface MetodologiaFixture {
  id: string
  nome: string
  tipo: string
}

export interface PlanoFixture {
  id: string
  titulo: string
  autoria: string
  objetosConhecimento: string
  componentePrincipal: ComponenteFixture | null
  componentesSecundarios: ComponenteFixture[]
  series: SerieFixture[]
  metodologias: MetodologiaFixture[]
  duracaoAulas: number | null
  duracaoDescricao: string | null
  arquivoUrl: string
  publicadoEm: string | null
}

/** Ids fixos, para o teste poder montar a querystring sem descobrir o id
 * antes. Um GUID gerado ao acaso obrigaria cada teste a ler o vocabulário
 * primeiro só para filtrar. */
export const COMPONENTES_FIXTURE: ComponenteFixture[] = [
  { id: '20000000-0000-0000-0000-000000000001', nome: 'Matemática', area: 'Matemática e suas Tecnologias', sigla: 'MA', cor: 'comp-matematica' },
  { id: '20000000-0000-0000-0000-000000000002', nome: 'Língua Portuguesa', area: 'Linguagens e suas Tecnologias', sigla: 'PT', cor: 'comp-linguagens' },
  { id: '20000000-0000-0000-0000-000000000003', nome: 'Química', area: 'Ciências da Natureza e suas Tecnologias', sigla: 'QU', cor: 'comp-natureza' },
  { id: '20000000-0000-0000-0000-000000000004', nome: 'História', area: 'Ciências Humanas e Sociais Aplicadas', sigla: 'HI', cor: 'comp-humanas' },
  { id: '20000000-0000-0000-0000-000000000005', nome: 'Arte', area: 'Linguagens e suas Tecnologias', sigla: 'AR', cor: 'comp-linguagens' },
]

export const SERIES_FIXTURE: SerieFixture[] = [
  { id: '30000000-0000-0000-0000-000000000001', nome: '6º ano', rotuloCompleto: '6º ano do Ensino Fundamental', sigla: '6º', etapa: 'fundamental_anos_finais', ordem: 1 },
  { id: '30000000-0000-0000-0000-000000000002', nome: '7º ano', rotuloCompleto: '7º ano do Ensino Fundamental', sigla: '7º', etapa: 'fundamental_anos_finais', ordem: 2 },
  { id: '30000000-0000-0000-0000-000000000003', nome: '8º ano', rotuloCompleto: '8º ano do Ensino Fundamental', sigla: '8º', etapa: 'fundamental_anos_finais', ordem: 3 },
  { id: '30000000-0000-0000-0000-000000000004', nome: '9º ano', rotuloCompleto: '9º ano do Ensino Fundamental', sigla: '9º', etapa: 'fundamental_anos_finais', ordem: 4 },
  { id: '30000000-0000-0000-0000-000000000005', nome: '2ª série', rotuloCompleto: '2ª série do Ensino Médio', sigla: '2ªEM', etapa: 'medio', ordem: 6 },
]

export const METODOLOGIAS_FIXTURE: MetodologiaFixture[] = [
  { id: '40000000-0000-0000-0000-000000000001', nome: 'Rotação por Estações de Aprendizagem', tipo: 'metodologia' },
  { id: '40000000-0000-0000-0000-000000000002', nome: 'Estudo de Casos', tipo: 'metodologia' },
  { id: '40000000-0000-0000-0000-000000000003', nome: 'Sala de Aula Invertida', tipo: 'metodologia' },
  { id: '40000000-0000-0000-0000-000000000004', nome: 'Escape Room', tipo: 'metodologia' },
  // Uma ferramenta, para provar que o filtro de metodologia NÃO a mostra.
  { id: '40000000-0000-0000-0000-000000000005', nome: 'Kahoot', tipo: 'ferramenta' },
]

export const VOCABULARIO_FIXTURE = {
  componentes: COMPONENTES_FIXTURE,
  series: SERIES_FIXTURE,
  metodologias: METODOLOGIAS_FIXTURE,
}

const DURACOES: [number | null, string | null][] = [
  [1, null],
  [2, null],
  [null, 'Sequência didática'],
]

/**
 * Gera `quantidade` planos determinísticos.
 *
 * O total padrão (14) é de propósito MAIOR que o tamanho de página (12,
 * `TAMANHO_PAGINA` em `features/filtrar-planos/useFiltroPlanos.ts`): com um
 * total menor, "Próxima" nasceria desabilitada e o teste de paginação
 * passaria sem provar nada sobre o `X-Total-Count`.
 *
 * Componentes, séries e metodologias ciclam por índice, então cada recorte
 * do filtro tem alvo previsível e não-vazio.
 *
 * O plano de índice 2 (o terceiro) é INTERDISCIPLINAR: tem Arte como
 * componente secundário, e duas séries. É o alvo dos testes que provam que
 * buscar por um componente secundário acha a prática, e que um plano atende
 * mais de uma série.
 */
export function gerarPlanos(quantidade = 14): PlanoFixture[] {
  return Array.from({ length: quantidade }, (_, indice) => {
    const numero = indice + 1
    const principal = COMPONENTES_FIXTURE[indice % COMPONENTES_FIXTURE.length]!
    const serie = SERIES_FIXTURE[indice % SERIES_FIXTURE.length]!
    const metodologia = METODOLOGIAS_FIXTURE[indice % 4]!
    const [aulas, descricao] = DURACOES[indice % DURACOES.length]!
    const interdisciplinar = indice === 2

    return {
      id: `10000000-0000-0000-0000-${String(numero).padStart(12, '0')}`,
      titulo: `Plano${String(numero).padStart(3, '0')} de exemplo`,
      autoria: `Autoria ${numero}`,
      objetosConhecimento: `Objeto de conhecimento ${numero}`,
      componentePrincipal: principal,
      componentesSecundarios: interdisciplinar ? [COMPONENTES_FIXTURE[4]!] : [],
      series: interdisciplinar ? [SERIES_FIXTURE[2]!, SERIES_FIXTURE[3]!] : [serie],
      metodologias: interdisciplinar
        ? [METODOLOGIAS_FIXTURE[3]!, METODOLOGIAS_FIXTURE[0]!]
        : [metodologia],
      duracaoAulas: aulas,
      duracaoDescricao: descricao,
      arquivoUrl: `/planos/plano-${String(numero).padStart(3, '0')}.pdf`,
      publicadoEm: '2026-08-01T12:00:00Z',
    }
  })
}

/**
 * Aplica busca, recorte e paginação sobre a fixture, do jeito que o back-end
 * aplicaria. Compartilhado pelas duas simulações pelo mesmo motivo da
 * fixture: uma lógica de paginação divergente entre elas faria o e2e e o
 * unitário provarem coisas diferentes.
 */
export function paginarPlanos(
  parametros: URLSearchParams,
  todos: PlanoFixture[],
): { itens: PlanoFixture[]; total: number } {
  const busca = (parametros.get('q') ?? '').toLowerCase()
  const pagina = Number(parametros.get('page') ?? '1')
  const porPagina = Number(parametros.get('perPage') ?? '12')
  const componente = parametros.get('componente')
  const serie = parametros.get('serie')
  const metodologia = parametros.get('metodologia')
  const duracaoMax = parametros.get('duracaoMax')

  let filtrados = todos

  if (busca) {
    filtrados = filtrados.filter(
      (p) =>
        p.titulo.toLowerCase().includes(busca) ||
        p.autoria.toLowerCase().includes(busca) ||
        p.objetosConhecimento.toLowerCase().includes(busca),
    )
  }
  // O componente casa com o principal OU com um secundário: buscar por Arte
  // precisa achar a prática em que Arte é secundária.
  if (componente) {
    filtrados = filtrados.filter(
      (p) =>
        p.componentePrincipal?.id === componente ||
        p.componentesSecundarios.some((c) => c.id === componente),
    )
  }
  if (serie) filtrados = filtrados.filter((p) => p.series.some((s) => s.id === serie))
  if (metodologia) {
    filtrados = filtrados.filter((p) => p.metodologias.some((m) => m.id === metodologia))
  }
  // Plano sem duração declarada fica FORA do recorte: `null` não é zero.
  if (duracaoMax) {
    const max = Number(duracaoMax)
    filtrados = filtrados.filter((p) => p.duracaoAulas !== null && p.duracaoAulas <= max)
  }

  const inicio = (pagina - 1) * porPagina
  return { itens: filtrados.slice(inicio, inicio + porPagina), total: filtrados.length }
}

/** A ficha completa, como `GET /api/v1/lesson-plans/{id}` a devolve. */
export function detalharPlano(plano: PlanoFixture) {
  return {
    ...plano,
    objetivo: `Objetivo da prática ${plano.titulo}.`,
    expectativasAprendizagem: `Expectativas de aprendizagem de ${plano.titulo}.`,
    recursos: 'Cartões de pistas, projetor, QR Codes, timer.',
    modalidade: 'Integral',
    etapas: [
      { ordem: 1, titulo: 'Início da Missão', descricao: 'Contextualize a missão.' },
      { ordem: 2, titulo: 'Formação das Equipes', descricao: 'Divida a turma em equipes.' },
    ],
    // Vazio de propósito: nenhum relato real do acervo traz código BNCC, e a
    // ficha precisa ficar íntegra sem eles.
    codigosBncc: [] as string[],
    linksExtras: null,
  }
}

// ── Blog ─────────────────────────────────────────────────────────────────

export interface PostFixture {
  id: string
  titulo: string
  resumo: string | null
  corpo: string
  autorNome: string
  situacao: string
  publicadoEm: string | null
  criadoEm: string
  comentarioModeracao: string | null
}

/**
 * Textos do blog, um por situação.
 *
 * Cobrir as quatro é o ponto: a listagem pública precisa mostrar SÓ o
 * publicado, e a fila de moderação precisa de alvo em cada aba.
 */
export const POSTS_FIXTURE: PostFixture[] = [
  {
    id: '70000000-0000-0000-0000-000000000001',
    titulo: 'Escape Room na aula de Química',
    resumo: 'Como transformei revisão de escalas em jogo.',
    corpo: 'Relato completo da prática.\n\nSegundo parágrafo do relato.',
    autorNome: 'Professora Ana',
    situacao: 'publicado',
    publicadoEm: '2026-08-10T12:00:00Z',
    criadoEm: '2026-08-08T12:00:00Z',
    comentarioModeracao: null,
  },
  {
    id: '70000000-0000-0000-0000-000000000002',
    titulo: 'Rotação por estações em turma grande',
    resumo: null,
    corpo: 'Texto aguardando aprovação.',
    autorNome: 'Professor Bruno',
    situacao: 'pendente',
    publicadoEm: null,
    criadoEm: '2026-08-20T12:00:00Z',
    comentarioModeracao: null,
  },
  {
    id: '70000000-0000-0000-0000-000000000003',
    titulo: 'Gamificação no 7º ano',
    resumo: null,
    corpo: 'Texto que voltou para ajuste.',
    autorNome: 'Professora Ana',
    situacao: 'devolvido',
    publicadoEm: null,
    criadoEm: '2026-08-18T12:00:00Z',
    comentarioModeracao: 'Acrescente as fotos da atividade.',
  },
]

/** Aplica situação, autor e busca, do jeito que o back-end aplicaria. */
export function filtrarPosts(
  parametros: URLSearchParams,
  todos: PostFixture[],
  situacaoPadrao = 'publicado',
): { itens: PostFixture[]; total: number } {
  const situacao = parametros.get('situacao') ?? situacaoPadrao
  const busca = (parametros.get('q') ?? '').toLowerCase()

  let filtrados = todos.filter((p) => p.situacao === situacao)

  if (busca) {
    filtrados = filtrados.filter(
      (p) => p.titulo.toLowerCase().includes(busca) || p.corpo.toLowerCase().includes(busca),
    )
  }

  return { itens: filtrados, total: filtrados.length }
}

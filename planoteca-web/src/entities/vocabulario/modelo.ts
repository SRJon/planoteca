/**
 * O vocabulário que classifica um plano — componentes, séries e
 * metodologias.
 *
 * ── Por que isto deixou de ser um union de literais ──────────────────────
 *
 * Até 2026-08-22 `entities/plano/modelo.ts` tinha `COMPONENTES` e `ANOS`
 * como listas FECHADAS em TypeScript, com a cor e a sigla escritas ao lado.
 * O compilador garantia que um componente sem cor não compilava.
 *
 * O acervo real derrubou isso. Os relatos da SEDU trazem Química, Física e
 * Biologia — nenhuma cabia em "Ciências" genérico — e 2ª e 3ª série do
 * Ensino Médio, que a lista de cinco anos não tinha. Fechar o vocabulário em
 * código significaria um deploy a cada componente novo, e a Planoteca é
 * povoada por quem administra o acervo, não por quem escreve código.
 *
 * O que se GANHOU: o administrador cadastra e a Biblioteca mostra.
 * O que se PERDEU: a garantia em tempo de compilação. A cor agora é dado, e
 * um componente cadastrado sem cor nasceria com bloco transparente. Duas
 * defesas substituem o compilador — `cor` e `sigla` são `NOT NULL` no banco,
 * e `corDoComponente()` abaixo tem um fallback neutro.
 */

/** Um componente curricular, como a API o entrega. */
export type Componente = {
  id: string
  nome: string
  /** A área do conhecimento que agrupa o componente. O filtro agrupa por ela,
   * e é dela que vem a cor. */
  area: string
  /** Duas letras. É o que o bloco do card mostra. */
  sigla: string
  /** O token de cor do tema — `comp-natureza` e afins. Nome de TOKEN, nunca
   * um valor de cor: `npm run lint` reprova cor literal em componente, e a
   * promessa de trocar a paleta num arquivo só depende disto. */
  cor: string
  /** A posição dentro da área. A Biblioteca não a usa — ela agrupa por área e
   * confia na ordem que a API mandou —, mas a tela de gestão sim: sem ela,
   * desativar um componente reescreveria a ordem com um palpite. */
  ordem: number
  /** Campo MASCULINO — espelha `ComponenteDto.Ativo` na API. Sempre `true`
   * na rota pública, que só carrega ativo; a tela de gestão é quem precisa
   * do inativo à vista. */
  ativo: boolean
}

/** Uma série da educação básica. */
export type Serie = {
  id: string
  /** "6º ano", "2ª série". Ambíguo sozinho: "1ª série" existe no Fundamental
   * e no Médio. Para exibir fora de contexto, use `rotuloCompleto`. */
  nome: string
  /** "2ª série do Ensino Médio". */
  rotuloCompleto: string
  /** Cabe no chip do filtro: "6º", "2ªEM". */
  sigla: string
  /** `fundamental_anos_finais` ou `medio`. O filtro agrupa por isto. */
  etapa: string
  /** Ordem global 1..7. Ordene por ela, nunca pelo nome — "10º" viria antes
   * de "9º" em ordem alfabética. */
  ordem: number
  /** Campo FEMININO — espelha `SerieDto.Ativa` na API. Não uniformize com o
   * `ativo` de `Componente`: o nome segue o gênero do substantivo do lado do
   * servidor. */
  ativa: boolean
}

/** Uma metodologia ativa, técnica ou ferramenta digital. */
export type Metodologia = {
  id: string
  nome: string
  /** `metodologia`, `tecnica` ou `ferramenta`, conforme o Guia de
   * Metodologias Ativas (UGB/FERP, 2020). */
  tipo: string
  /** Campo FEMININO — espelha `MetodologiaDto.Ativa` na API. Mesma ressalva
   * de `Serie.ativa`. */
  ativa: boolean
}

/** O vocabulário inteiro, como `GET /api/v1/vocabulary` o devolve. */
export type Vocabulario = {
  componentes: Componente[]
  series: Serie[]
  metodologias: Metodologia[]
}

/** O vocabulário vazio. Serve de valor inicial enquanto a busca está em voo:
 * a tela desenha os filtros sem opção em vez de quebrar. */
export const VOCABULARIO_VAZIO: Vocabulario = {
  componentes: [],
  series: [],
  metodologias: [],
}

/**
 * As classes de cor que o tema conhece.
 *
 * É um mapa ESCRITO, e não `` `bg-${cor}` `` interpolado: o Tailwind gera
 * utilitário varrendo o fonte por texto literal, e uma classe montada em
 * tempo de execução simplesmente não existe no CSS final — o bloco nasceria
 * transparente. A `scripts/verifica-tokens.mjs` também não teria como
 * auditar o que não está escrito.
 */
const CLASSE_POR_TOKEN: Record<string, string> = {
  'comp-linguagens': 'bg-comp-linguagens',
  'comp-matematica': 'bg-comp-matematica',
  'comp-natureza': 'bg-comp-natureza',
  'comp-humanas': 'bg-comp-humanas',
}

/** O neutro de quando a cor não é reconhecida. */
const CLASSE_NEUTRA = 'bg-secondary'

/**
 * Os quatro tokens de cor que o formulário de gestão oferece, com um rótulo
 * legível cada.
 *
 * A metade gêmea desta lista é `CorComponente.cs`
 * (`planoteca-api/src/SaraivaTech.Planoteca.Domain/Enumerable/CorComponente.cs`)
 * — as duas precisam concordar. Deriva de `CLASSE_POR_TOKEN` acima, e não de
 * uma lista solta, para não existir uma TERCEIRA enumeração dos mesmos quatro
 * tokens dentro deste arquivo.
 */
export const CORES_COMPONENTE: { token: string; rotulo: string }[] = [
  { token: 'comp-linguagens', rotulo: 'Linguagens e suas Tecnologias' },
  { token: 'comp-matematica', rotulo: 'Matemática e suas Tecnologias' },
  { token: 'comp-natureza', rotulo: 'Ciências da Natureza e suas Tecnologias' },
  { token: 'comp-humanas', rotulo: 'Ciências Humanas e Sociais Aplicadas' },
]

/**
 * A classe que pinta o bloco de um componente.
 *
 * O fallback é a defesa que substituiu o compilador: um componente cadastrado
 * com um token que o tema não tem sai NEUTRO, e não invisível. Antes o
 * TypeScript recusava esse caso; agora ele chega em tempo de execução, vindo
 * do banco, e a única escolha é degradar de forma visível.
 */
export function classeCorComponente(componente: { cor: string } | null | undefined): string {
  if (!componente) return CLASSE_NEUTRA
  return CLASSE_POR_TOKEN[componente.cor] ?? CLASSE_NEUTRA
}

/** Os componentes agrupados por área, na ordem em que a API os devolveu. */
export function agruparPorArea(componentes: Componente[]): [string, Componente[]][] {
  const grupos = new Map<string, Componente[]>()
  for (const componente of componentes) {
    const atual = grupos.get(componente.area)
    if (atual) atual.push(componente)
    else grupos.set(componente.area, [componente])
  }
  return [...grupos.entries()]
}

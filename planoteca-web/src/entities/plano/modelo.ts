/**
 * Domínio de plano de aula — a entidade central da Planoteca.
 *
 * ── O que mudou em 2026-08-22, e por quê ─────────────────────────────────
 *
 * Este arquivo tinha `COMPONENTES` e `ANOS` como unions fechados, com cor e
 * sigla escritas ao lado, mais `bncc` obrigatório. O acervo real da SEDU
 * derrubou as três coisas:
 *
 * - Os relatos trazem **Química, Física e Biologia** — nenhuma cabia em
 *   "Ciências" genérico — e **2ª e 3ª série do Médio**, ausentes da lista de
 *   cinco anos.
 * - Um relato declara "2ª série I01 **e** 2ª série I02", e prática
 *   interdisciplinar cruza componentes: as duas relações são **N**, não 1.
 * - **Nenhum dos relatos analisados cita um código BNCC.** O eixo de busca
 *   real é "Objetos de conhecimento abordados", que todo plano tem.
 *
 * O vocabulário virou tabela no banco e chega por `GET /api/v1/vocabulary`
 * (ver `entities/vocabulario`). Aqui ficou só a forma do plano.
 */

/**
 * ── Por que os tipos de vocabulário são DECLARADOS aqui ──────────────────
 *
 * `Componente`, `Serie` e `Metodologia` também existem em
 * `entities/vocabulario`, e à primeira vista importar de lá seria o certo.
 * A fronteira de camadas proíbe (`eslint-plugin-boundaries`: uma fatia de
 * `entities` só importa de `shared`), e a proibição está correta — duas
 * fatias que se importam deixam de poder nascer e morrer separadas.
 *
 * O que trafega aqui é o que o plano EMBUTE na resposta de
 * `GET /api/v1/lesson-plans`, que é um subconjunto do que a rota de
 * vocabulário devolve. São formas estruturalmente compatíveis: um
 * `Componente` de `entities/vocabulario` satisfaz este tipo, e é por isso
 * que `classeCorComponente()` aceita os dois.
 *
 * Se um dia divergirem de verdade, a duplicação é o que permite cada uma
 * seguir seu caminho sem quebrar a outra.
 */

/** O componente curricular embutido no plano. */
export type ComponenteDoPlano = {
  id: string
  nome: string
  area: string
  sigla: string
  /** Token de cor do tema. Ver `classeCorComponente` em
   * `entities/vocabulario`. */
  cor: string
}

/** A série embutida no plano. */
export type SerieDoPlano = {
  id: string
  nome: string
  rotuloCompleto: string
  sigla: string
  etapa: string
  ordem: number
}

/** A metodologia embutida no plano. */
export type MetodologiaDoPlano = {
  id: string
  nome: string
  tipo: string
}

/** Um passo do roteiro: "ETAPA 1: Início da Missão". */
export type EtapaPlano = {
  ordem: number
  titulo: string | null
  descricao: string
}

/** Um plano na listagem da Biblioteca — o que o CARD mostra. */
export type Plano = {
  id: string
  titulo: string
  /** Quem escreveu. É TEXTO, e não uma pessoa cadastrada: o autor do PDF
   * quase nunca tem conta no sistema. */
  autoria: string
  /**
   * "Objetos de conhecimento abordados" — "Escalas Termométricas",
   * "Organelas Celulares". É o eixo de busca do acervo, no lugar do código
   * BNCC que os relatos não trazem.
   */
  objetosConhecimento: string
  /**
   * O componente que pinta o bloco do card.
   *
   * Pode vir `null`: um plano gravado por fora da validação pode não ter
   * principal. `classeCorComponente()` degrada para o neutro em vez de
   * deixar o bloco invisível.
   */
  componentePrincipal: ComponenteDoPlano | null
  /** Os demais componentes, quando a prática é interdisciplinar. Aparecem na
   * ficha, e continuam filtráveis. */
  componentesSecundarios: ComponenteDoPlano[]
  /** As séries que o plano atende. Mais de uma é comum. */
  series: SerieDoPlano[]
  metodologias: MetodologiaDoPlano[]
  /** Número de aulas. `null` significa "não declarada", e NÃO zero — por isso
   * o filtro por duração exclui esses planos em vez de tratá-los como 0. */
  duracaoAulas: number | null
  /** O que o número não expressa: "Sequência didática", "1 bimestre". */
  duracaoDescricao: string | null
  /** O PDF, no Cloudflare R2. Público, sem token. */
  arquivoUrl: string
  publicadoEm: string | null
  /**
   * `rascunho` ou `publicado`.
   *
   * Na listagem pública é sempre `publicado` — a API não devolve outra coisa.
   * O campo existe para a tela de GESTÃO, onde o administrador vê os dois e
   * precisa distinguir o que já está no ar.
   *
   * OBRIGATÓRIO, e não opcional como era. O `?` calava o TypeScript sobre um
   * campo que a API simplesmente não enviava: a tela de gestão recebia
   * `undefined`, `undefined !== 'publicado'` dava rascunho, e um plano
   * publicado aparecia com a etiqueta errada, oferecia "Publicar" em vez de
   * "Despublicar", e recusava a remoção com uma mensagem que contradizia a
   * própria tela. Um campo ausente, três sintomas.
   */
  situacao: SituacaoPlano
}

/** As duas situações de um plano. União fechada: uma terceira exige decidir
 * o que a Biblioteca faz com ela. */
export type SituacaoPlano = 'rascunho' | 'publicado'

/** A ficha completa: tudo do card, mais o roteiro. */
export type PlanoDetalhe = Plano & {
  objetivo: string
  expectativasAprendizagem: string
  recursos: string | null
  /** Regular, Integral, Integrado. */
  modalidade: string | null
  etapas: EtapaPlano[]
  /** Vazio na maioria dos planos, e isso é o normal. */
  codigosBncc: string[]
  linksExtras: string | null
}

/**
 * O rótulo de duração para a interface.
 *
 * Junta as duas colunas quando as duas existem, porque elas dizem coisas
 * diferentes: "2 aulas" é quantidade, "Sequência didática" é formato.
 */
export function rotuloDuracao(plano: {
  duracaoAulas?: number | null
  duracaoDescricao?: string | null
}): string | null {
  const aulas = plano.duracaoAulas
  const descricao = plano.duracaoDescricao?.trim()

  // `== null` casa com `null` E `undefined`, de propósito. A API OMITE o
  // campo quando não há duração, em vez de mandar `null` — e um `=== null`
  // deixava `undefined` passar direto para a interpolação, que rendia
  // "undefined aulas" na tela.
  if (aulas == null) return descricao ?? null

  const emAulas = aulas === 1 ? '1 aula' : `${aulas} aulas`
  return descricao ? `${emAulas} · ${descricao}` : emAulas
}

/**
 * Quantos planos um item do vocabulário devolveria, dada a seleção atual.
 *
 * A resposta traz só id com pelo menos um plano (RF-01). Id ausente vale
 * zero, e o item continua VISÍVEL na coluna: esconder o que dá zero tiraria
 * da tela a informação de que o componente existe no acervo.
 */
export type ContagemFaceta = {
  id: string
  total: number
}

/**
 * As três contagens de `GET /api/v1/lesson-plans/facets`.
 *
 * A contagem de um grupo IGNORA a seleção do próprio grupo (RF-02). É o que
 * faz o número ao lado de História responder "quantos planos eu ganharia se
 * marcasse História", e não "quantos tenho agora", que seria sempre zero
 * para todo item não marcado.
 */
export type Facetas = {
  series: ContagemFaceta[]
  componentes: ContagemFaceta[]
  metodologias: ContagemFaceta[]
}

/** As facetas vazias. Valor corrente enquanto a busca está em voo: a coluna
 * desenha sem número em vez de quebrar. */
export const FACETAS_VAZIAS: Facetas = {
  series: [],
  componentes: [],
  metodologias: [],
}

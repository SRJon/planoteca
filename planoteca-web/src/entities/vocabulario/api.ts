import type { Cliente } from '@/shared/api'
import type { Componente, Metodologia, Serie, Vocabulario } from './modelo'

/**
 * O formato de fio de `GET /api/v1/vocabulary`.
 *
 * Ele é IGUAL ao domínio, campo a campo — e por isso não existe um
 * `mapeador.ts` nesta fatia, ao contrário de `entities/plano` e
 * `entities/pessoa`.
 *
 * Não é descuido: é o que acontece quando o back-end e o front concordam
 * sobre o vocabulário desde o começo. A API já responde em camelCase e em
 * português, porque estes nomes são do DOMÍNIO da educação básica, não de um
 * sistema legado que precisou ser traduzido. Se um dia o contrato divergir —
 * um campo novo, um nome diferente —, é aqui que o mapeador nasce, e nenhum
 * consumidor percebe.
 */
type VocabularioApi = Vocabulario

/**
 * Busca o vocabulário inteiro.
 *
 * Uma chamada para as três listas. O endpoint devolve as três juntas de
 * propósito: a Biblioteca precisa delas para desenhar os filtros, e o
 * formulário de catalogação para montar os seletores. Três idas ao servidor
 * pintariam a mesma tela três vezes mais devagar — e no Render gratuito, que
 * hiberna, a primeira ida já é lenta.
 *
 * Recebe `cliente` por parâmetro: este pacote é `entities`, que só importa de
 * `shared`; quem decide de onde vem o `Cliente` concreto é quem monta a tela.
 */
export async function buscarVocabulario(cliente: Cliente): Promise<Vocabulario> {
  const resposta = await cliente.obter<VocabularioApi>('/vocabulary')
  // `obter` devolve `null` num 204. Um vocabulário ausente não é erro de
  // rede: é uma base recém-criada, sem seed. A tela desenha os filtros
  // vazios em vez de quebrar.
  return resposta ?? { componentes: [], series: [], metodologias: [] }
}

/**
 * Busca o vocabulário completo, inativo incluso — `GET
 * /api/v1/admin/vocabulary` (RF-03). Rota fechada por
 * `[Authorize(Policy = "Administrador")]`; o `cliente` já manda o token em
 * toda chamada (`shared/api/cliente.ts`).
 */
export async function buscarVocabularioAdmin(cliente: Cliente): Promise<Vocabulario> {
  const resposta = await cliente.obter<VocabularioApi>('/admin/vocabulary')
  return resposta ?? { componentes: [], series: [], metodologias: [] }
}

/** O que o formulário de gestão envia para cadastrar ou alterar um
 * componente. Espelha `ComponenteEntradaDto` — campo `ativo`, masculino.
 *
 * `ordem` NÃO entra: a API a calcula, e o componente novo nasce no fim da
 * própria área. Um campo a menos num formulário de povoamento. */
export type ComponenteEntrada = {
  nome: string
  area: string
  sigla: string
  cor: string
  ativo: boolean
}

/** Espelha `SerieEntradaDto` — campo `ativa`, feminino.
 *
 * `ordem` NÃO entra, e aqui a razão é forte: `serie.ordem` é UNIQUE no banco.
 * Enquanto o campo existiu no formulário, cadastrar com um número já ocupado
 * estourava a exceção crua do EF Core na cara de quem cadastra. A API calcula
 * a posição no fim da própria etapa. */
export type SerieEntrada = {
  nome: string
  etapa: string
  rotuloCompleto: string
  sigla: string
  ativa: boolean
}

/** Espelha `MetodologiaEntradaDto` — campo `ativa`, feminino. */
export type MetodologiaEntrada = {
  nome: string
  tipo: string
  ativa: boolean
}

/** Cadastra um componente. `201` com o criado (RF-09). */
export async function criarComponente(cliente: Cliente, entrada: ComponenteEntrada): Promise<Componente> {
  const criado = await cliente.enviar<Componente>('/admin/vocabulary/components', entrada)
  // A API sempre devolve corpo num `201`; `enviar` só tipa como nulável
  // porque também serve rota que responde `204`.
  return criado as Componente
}

/** Altera um componente, inclusive para desativar (`ativo: false`). `204`
 * sem corpo (RF-09). */
export async function alterarComponente(
  cliente: Cliente,
  id: string,
  entrada: ComponenteEntrada,
): Promise<void> {
  await cliente.atualizar(`/admin/vocabulary/components/${id}`, entrada)
}

/** Cadastra uma série. `201` com a criada (RF-09). */
export async function criarSerie(cliente: Cliente, entrada: SerieEntrada): Promise<Serie> {
  const criada = await cliente.enviar<Serie>('/admin/vocabulary/grades', entrada)
  return criada as Serie
}

/** Altera uma série, inclusive para desativar (`ativa: false`). `204` sem
 * corpo (RF-09). */
export async function alterarSerie(cliente: Cliente, id: string, entrada: SerieEntrada): Promise<void> {
  await cliente.atualizar(`/admin/vocabulary/grades/${id}`, entrada)
}

/** Cadastra uma metodologia. `201` com a criada (RF-09). */
export async function criarMetodologia(cliente: Cliente, entrada: MetodologiaEntrada): Promise<Metodologia> {
  const criada = await cliente.enviar<Metodologia>('/admin/vocabulary/methodologies', entrada)
  return criada as Metodologia
}

/** Altera uma metodologia, inclusive para desativar (`ativa: false`). `204`
 * sem corpo (RF-09). */
export async function alterarMetodologia(
  cliente: Cliente,
  id: string,
  entrada: MetodologiaEntrada,
): Promise<void> {
  await cliente.atualizar(`/admin/vocabulary/methodologies/${id}`, entrada)
}

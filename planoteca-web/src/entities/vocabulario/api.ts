import type { Cliente } from '@/shared/api'
import type { Vocabulario } from './modelo'

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

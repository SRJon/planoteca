import type { ReactNode } from 'react'
import type { Pessoa } from '@/entities/pessoa'
import { formatar } from '@/shared/lib/data'
import { Badge } from '@/components/ui/badge'

/**
 * A descrição de UMA coluna da lista.
 *
 * O tipo vive aqui, ao lado da única tela que o consome, porque a tabela
 * deixou de ser um componente genérico: virou marcação de `Table` do shadcn
 * sobre o motor do `@tanstack/react-table`, montada dentro de
 * `PaginaPessoas`. Uma tela nova copia este arquivo e troca os campos — que
 * é exatamente o que um boilerplate deve pedir.
 */
export interface ColunaPessoa {
  /** Chave da coluna: o `campo` que `ordenarPor` recebe, e o `id` no TanStack. */
  campo: string
  cabecalho: string
  renderizar: (linha: Pessoa) => ReactNode
  /** Habilita o clique de ordenação no cabeçalho. Quem ordena é o servidor. */
  ordenavel?: boolean
  /**
   * Largura real da coluna: a tabela usa `table-layout: fixed`, então o
   * conteúdo não a estica.
   *
   * Sem valor declarado, a largura de cada coluna viria do conteúdo da
   * PÁGINA ATUAL — uma página com nome curto e outra com nome longo
   * desenhariam grades diferentes, e as colunas pulariam de lugar a cada
   * paginação ou busca.
   */
  largura: string
  /**
   * Algarismo de largura fixa (`tabular-nums`). Sem isto os dígitos de uma
   * linha não alinham com os da linha de baixo, e a coluna "treme" ao
   * paginar.
   */
  mono?: boolean
  /** Alinha à direita — a convenção de todo dado numérico da tabela. */
  direita?: boolean
}

/**
 * Colunas da lista de pessoas — a fatia de EXEMPLO do boilerplate, o recorte
 * que prova tabela, ordenação de servidor e formatação de data/booleano num
 * fluxo real.
 *
 * - **Nome** (`nomeCompleto`): a primeira coluna, por onde se procura UMA
 *   pessoa específica. Ordena por `nome` (`ordenacaoApi.ts` traduz para
 *   `FirstName`); o sobrenome não tem coluna própria porque já aparece
 *   aqui, via `nomeCompleto` (`entities/pessoa/mapeador.ts`).
 * - **Tipo**: texto simples, não `Badge` — não é um estado do registro (não
 *   muda ao longo do tempo, não tem tom de "ok/alerta/erro"), é um atributo
 *   descritivo. A etiqueta fica reservada para `Situação`.
 * - **Nascimento**: `formatar` (`shared/lib/data`) já resolve fuso e
 *   travessão para data ausente — nunca formatação local nesta camada.
 * - **Idade**: número derivado no servidor (`PersonSampleDto.age`).
 * - **Situação**: o único campo com tom semântico real. `secondary` para
 *   inativo em vez de uma segunda cor: inativo é ausência de destaque, não
 *   um alerta. A coluna só ESCOLHE a variante, nunca uma cor fora do tema.
 */
export const COLUNAS_PESSOAS: ColunaPessoa[] = [
  {
    campo: 'nome',
    largura: '220px',
    cabecalho: 'Nome',
    renderizar: (linha) => <span className="font-medium text-foreground">{linha.nomeCompleto}</span>,
    ordenavel: true,
  },
  {
    campo: 'tipo',
    largura: '110px',
    cabecalho: 'Tipo',
    renderizar: (linha) => (linha.tipo === 'masculino' ? 'Masculino' : 'Feminino'),
  },
  {
    campo: 'nascimento',
    largura: '130px',
    cabecalho: 'Nascimento',
    renderizar: (linha) => formatar(linha.nascimento),
    ordenavel: true,
    mono: true,
  },
  {
    campo: 'idade',
    largura: '90px',
    cabecalho: 'Idade',
    renderizar: (linha) => String(linha.idade),
    ordenavel: true,
    mono: true,
    direita: true,
  },
  {
    campo: 'ativo',
    largura: '110px',
    cabecalho: 'Situação',
    renderizar: (linha) => (
      <Badge variant={linha.ativo ? 'default' : 'secondary'}>{linha.ativo ? 'Ativo' : 'Inativo'}</Badge>
    ),
    ordenavel: true,
  },
]

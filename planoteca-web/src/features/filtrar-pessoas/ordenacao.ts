/**
 * A ordenação escolhida — o eixo e o sentido.
 *
 * Vivia em `shared/ui/tabela`, quando existia uma `Tabela` genérica que
 * desenhava o cabeçalho ordenável. A `Tabela` saiu (a marcação virou `Table`
 * do shadcn dentro de `pages/pessoas`), e o tipo ficou sem casa. A casa
 * certa é esta fatia: quem produz e consome uma `Ordenacao` é o filtro —
 * `useFiltroPessoas` a lê e a escreve na URL, e `paraSortApi` a traduz para
 * o parâmetro `sort` da API. A tabela só recebe o resultado.
 */
export type DirecaoOrdenacao = 'asc' | 'desc'

export interface Ordenacao {
  campo: string
  direcao: DirecaoOrdenacao
}

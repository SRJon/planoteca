import { useMemo } from 'react'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown'
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft'
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight'
import { UsersThree } from '@phosphor-icons/react/dist/csr/UsersThree'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'
import type { Pessoa } from '@/entities/pessoa'
import { usePessoas } from '@/entities/pessoa'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FiltrosPessoas, useFiltroPessoas } from '@/features/filtrar-pessoas'
import { COLUNAS_PESSOAS } from './colunas'

/**
 * Lista de pessoas — a fatia de EXEMPLO do boilerplate, contra
 * `GET /api/v1/person-samples`. É a primeira tela real que quem adota o
 * boilerplate vê: o padrão de tabela + paginação + filtro que qualquer tela
 * nova replica.
 *
 * Paginação e ordenação são do SERVIDOR. A tabela não guarda ordem própria
 * (`manualSorting`), e `usePessoas` refaz a busca a cada mudança de
 * `filtro`. O filtro inteiro — busca, página, tamanho, situação e
 * ordenação — vive na URL (`useFiltroPessoas`): recarregar preserva o
 * estado, e a URL é compartilhável.
 *
 * A marcação da tabela é o `Table` do shadcn; o motor continua sendo o
 * `@tanstack/react-table`, usado só pelo que não tem UI: o modelo de linha
 * (`getCoreRowModel`) e a máquina de alternância de ordenação
 * (`getToggleSortingHandler`/`getIsSorted`). Não existe `Tabela` genérica
 * no meio: uma tela nova copia este arquivo e o `colunas.tsx` ao lado.
 *
 * As duas armadilhas do controller (RF-10), ambas absorvidas antes de
 * chegar aqui:
 *
 * - `GET /person-samples` devolve **204 sem corpo** quando o total é zero,
 *   não `200` com lista vazia. `cliente.listar` (`shared/api/cliente.ts`)
 *   já trata os dois como `{ itens: [], total: 0 }` — esta página não
 *   distingue os casos, só troca a tabela pelo estado vazio quando não
 *   veio nenhum item.
 * - `X-Total-Count` vem no CABEÇALHO, não no corpo — é de onde `total` sai
 *   (mesmo `cliente.listar`). A paginação abaixo depende inteiramente dele:
 *   sem o cabeçalho na resposta, `total` cairia no fallback `itens.length`,
 *   e "Próxima página" nasceria desabilitada em toda página cheia.
 *   `src/teste/servidor.ts` manda o cabeçalho de propósito, para o teste
 *   desta página não mascarar essa dependência.
 *
 * Recebe `cliente` por prop, como `PaginaEntrar` — não importa
 * `shared/config`, o que mantém a página testável sem `VITE_URL_API`. Quem
 * decide de onde vem o `Cliente` é `app/rotas/Rotas.tsx`.
 */
export function PaginaPessoas({ cliente }: { cliente: Cliente }) {
  const {
    filtro,
    pesquisaDigitada,
    definirPesquisa,
    pagina,
    porPagina,
    ativo,
    definirAtivo,
    ordenacao,
    irParaPagina,
    definirPorPagina,
    ordenarPor,
  } = useFiltroPessoas()

  const consulta = usePessoas(cliente, filtro)

  const itens = useMemo(() => consulta.data?.itens ?? [], [consulta.data])
  const total = consulta.data?.total ?? 0
  const inicio = itens.length === 0 ? 0 : (pagina - 1) * porPagina + 1
  const fim = itens.length === 0 ? 0 : inicio + itens.length - 1
  const temPaginaAnterior = pagina > 1
  const temProximaPagina = pagina * porPagina < total

  const definicoes = useMemo<ColumnDef<Pessoa>[]>(
    () =>
      COLUNAS_PESSOAS.map((coluna) => ({
        id: coluna.campo,
        // `getCanSort`/`getToggleSortingHandler` do TanStack exigem um
        // `accessorFn` truthy para considerar a coluna ordenável — condição
        // pensada para ordenação client-side, que calcularia o valor a
        // partir dele. Com `manualSorting: true` esse retorno nunca é lido:
        // quem ordena é o servidor, via `ordenarPor`. A função existe só
        // para satisfazer o gate interno da lib.
        accessorFn: () => undefined,
        enableSorting: Boolean(coluna.ordenavel),
      })),
    [],
  )

  const sorting: SortingState = ordenacao ? [{ id: ordenacao.campo, desc: ordenacao.direcao === 'desc' }] : []

  // `useReactTable` devolve um objeto com métodos recriados a cada
  // renderização — molde de biblioteca headless que o React Compiler não
  // consegue memoizar com segurança, e por isso avisa. O aviso é sobre a
  // FORMA da API do TanStack, não sobre este uso.
  // eslint-disable-next-line react-hooks/incompatible-library
  const tabela = useReactTable({
    data: itens,
    columns: definicoes,
    state: { sorting },
    manualSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    // Sem isto, `getFirstSortDir` adivinha a direção pelo tipo do valor da
    // primeira linha — e como `accessorFn` sempre devolve `undefined`, a
    // adivinhação cairia sempre em `desc`. O primeiro clique pede `asc`.
    sortDescFirst: false,
    getRowId: (linha) => linha.id,
    onSortingChange: (atualizador) => {
      const proxima = typeof atualizador === 'function' ? atualizador(sorting) : atualizador
      const alvo = proxima[0]
      if (alvo) ordenarPor(alvo.id, alvo.desc ? 'desc' : 'asc')
    },
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card>
      <CardHeader>
        {/* `CardTitle` do shadcn é um `div` — estilo, não semântica. O
            título da tela precisa ser um cabeçalho de verdade: é o que dá a
            âncora de navegação para leitor de tela, e o que
            `e2e/entrar-e-listar.spec.ts` procura por `getByRole('heading')`.
            `CardTitle` não aceita `asChild`, então o cabeçalho entra como
            filho dele e herda a classe. É `h1` porque o shell não desenha
            nenhum cabeçalho acima: o título da tela é o topo da árvore. */}
        <CardTitle className="text-base">
          <h1>Pessoas</h1>
        </CardTitle>
        <CardDescription>Fatia de exemplo do boilerplate — troque por seu domínio.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <FiltrosPessoas
          pesquisa={pesquisaDigitada}
          aoMudarPesquisa={definirPesquisa}
          porPagina={porPagina}
          aoMudarPorPagina={definirPorPagina}
          ativo={ativo}
          aoMudarAtivo={definirAtivo}
        />

        {consulta.isError ? (
          <p role="alert" className="px-2 py-6 text-sm text-destructive">
            {mensagemDe(consulta.error)}
          </p>
        ) : consulta.isPending ? (
          // Sem `role="status"` de propósito: outro provedor já usa esse
          // role para o aviso de expiração de sessão — dois elementos com o
          // mesmo role landmark simultâneos tornam `getByRole('status')`
          // ambíguo em qualquer teste que monte esta página dentro da sessão.
          <p className="px-2 py-6 text-sm text-muted-foreground">Carregando pessoas…</p>
        ) : itens.length === 0 ? (
          <VazioPessoas />
        ) : (
          <>
            <div className="-mx-1 overflow-x-auto">
              {/* `table-layout: fixed` + `<colgroup>` é o que trava a largura
                  de cada coluna. Sem isso a grade se redesenha a cada página,
                  porque o navegador dimensiona pelo conteúdo que chegou. */}
              <Table className="table-fixed" style={{ width: 'max(100%, 780px)' }}>
                <colgroup>
                  {COLUNAS_PESSOAS.map((coluna) => (
                    <col key={coluna.campo} style={{ width: coluna.largura }} />
                  ))}
                </colgroup>
                <TableHeader>
                  {tabela.getHeaderGroups().map((grupo) => (
                    <TableRow key={grupo.id} className="hover:bg-transparent">
                      {grupo.headers.map((cabecalho, indice) => {
                        const coluna = COLUNAS_PESSOAS[indice]
                        if (!coluna) return null
                        const podeOrdenar = cabecalho.column.getCanSort()
                        const estado = cabecalho.column.getIsSorted()

                        return (
                          <TableHead
                            key={cabecalho.id}
                            scope="col"
                            className={cn(
                              'px-3 text-xs font-medium text-muted-foreground',
                              coluna.direita && 'text-right',
                            )}
                            aria-sort={
                              !podeOrdenar
                                ? undefined
                                : estado === 'asc'
                                  ? 'ascending'
                                  : estado === 'desc'
                                    ? 'descending'
                                    : 'none'
                            }
                          >
                            {podeOrdenar ? (
                              // `Button` do shadcn, e não um `<button>` cru: a
                              // regra `react/forbid-elements` cobra o
                              // componente do sistema em todo controle. Aqui
                              // ele é recuado e sem altura fixa, para o
                              // cabeçalho continuar parecendo texto — o alvo
                              // de clique é que precisa existir, não uma
                              // segunda caixa desenhada dentro da célula.
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={cabecalho.column.getToggleSortingHandler()}
                                className={cn(
                                  '-mx-1.5 h-auto gap-1 px-1.5 py-1 text-xs font-medium text-inherit hover:text-foreground',
                                  coluna.direita && 'flex-row-reverse',
                                  estado && 'text-foreground',
                                )}
                              >
                                {coluna.cabecalho}
                                {/* Uma seta só, que gira: "crescente" e
                                    "decrescente" são a mesma ideia invertida,
                                    e dois desenhos diferentes fariam o leitor
                                    aprender dois símbolos. Apagada enquanto a
                                    coluna não é a ordenada. */}
                                <CaretDown
                                  aria-hidden
                                  weight="bold"
                                  className={cn(
                                    'size-3 transition-[transform,opacity]',
                                    estado === 'asc' && 'rotate-180',
                                    estado ? 'opacity-100' : 'opacity-30',
                                  )}
                                />
                              </Button>
                            ) : (
                              coluna.cabecalho
                            )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {tabela.getRowModel().rows.map((linha) => (
                    <TableRow key={linha.id}>
                      {COLUNAS_PESSOAS.map((coluna) => (
                        <TableCell
                          key={coluna.campo}
                          className={cn(
                            'overflow-hidden px-3 py-2.5 text-ellipsis',
                            coluna.mono && 'tabular-nums',
                            coluna.direita && 'text-right',
                          )}
                        >
                          {coluna.renderizar(linha.original)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <nav
              aria-label="Paginação"
              className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-3 text-sm text-muted-foreground"
            >
              <span className="tabular-nums">
                {inicio}–{fim} de {total.toLocaleString('pt-BR')}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Página anterior"
                  disabled={!temPaginaAnterior}
                  onClick={() => irParaPagina(pagina - 1)}
                >
                  <CaretLeft aria-hidden />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Próxima página"
                  disabled={!temProximaPagina}
                  onClick={() => irParaPagina(pagina + 1)}
                >
                  <CaretRight aria-hidden />
                </Button>
              </div>
            </nav>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * O vazio da lista. Diz o PRÓXIMO PASSO, nunca "nenhum resultado" — zero
 * cru não ajuda ninguém a sair da tela vazia.
 *
 * O ícone é do domínio (pessoas) e vem nu, no tom do texto secundário: sem
 * caixa tingida em volta, que só acrescentaria uma borda sem informação.
 */
function VazioPessoas() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <UsersThree aria-hidden className="size-7 text-muted-foreground" />
      <p className="font-medium text-foreground">Nenhuma pessoa encontrada</p>
      <p className="max-w-sm text-sm text-muted-foreground">Ajuste a busca ou os filtros e tente de novo.</p>
    </div>
  )
}

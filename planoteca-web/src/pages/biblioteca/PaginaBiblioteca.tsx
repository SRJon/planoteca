import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft'
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'
import { usePlanos } from '@/entities/plano'
import { useVocabulario } from '@/entities/vocabulario'
import { Button } from '@/components/ui/button'
import { FiltrosPlanos, TAMANHO_PAGINA, useFiltroPlanos } from '@/features/filtrar-planos'
import { Container } from '@/components/container'
import { FichaPlano } from './FichaPlano'

/**
 * O estado vazio. Distingue "nada casa com o filtro" de "a biblioteca está
 * vazia": a primeira é um beco com saída (afrouxar o recorte), a segunda
 * não, e um conselho de "limpe os filtros" para quem não filtrou nada só
 * confundiria.
 *
 * **Não repete o botão "Limpar filtros".** O painel de filtro fica logo
 * acima e já o mostra sempre que há recorte ativo; um segundo botão com o
 * mesmo nome dois blocos abaixo dá a quem usa leitor de tela dois controles
 * indistinguíveis pelo nome, e a quem enxerga a dúvida de se fazem a mesma
 * coisa. O texto aponta para o botão que já existe.
 */
function VazioBiblioteca({ temFiltro }: { temFiltro: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 border-2 border-traco bg-card px-6 py-12 text-center">
      <h2 className="text-lg">
        {temFiltro ? 'Nenhum plano com esses filtros' : 'A biblioteca ainda está vazia'}
      </h2>
      <p className="max-w-[46ch] text-muted-foreground">
        {temFiltro
          ? 'Afrouxe o recorte: desligue o ano ou o componente, busque por um termo mais curto, ou use "Limpar filtros" acima.'
          : 'Assim que os primeiros planos forem publicados, eles aparecem aqui.'}
      </p>
    </div>
  )
}

/**
 * A Biblioteca — a tela principal da Planoteca, contra
 * `GET /api/v1/lesson-plans`.
 *
 * É a tela desenhada em `design/DirecaoB.dc.html`, com a diferença de que
 * ali ela é um mockup de 390px e aqui a grade cresce com a largura: a
 * ficha é a mesma, e o que muda é quantas cabem por linha.
 *
 * Paginação e filtro são do SERVIDOR — `usePlanos` refaz a busca a cada
 * mudança de `filtro`, e o filtro inteiro vive na URL (`useFiltroPlanos`).
 * Numa biblioteca isso não é detalhe técnico: "manda o link desse filtro"
 * é como um professor passa uma seleção para outro.
 *
 * Duas armadilhas do back-end, ambas absorvidas por `cliente.listar`
 * (`shared/api/cliente.ts`) antes de chegar aqui, e documentadas em
 * `PaginaPessoas.tsx`: a lista vem **204 sem corpo** quando o total é zero,
 * e o total vem no cabeçalho **`X-Total-Count`**, não no corpo. A paginação
 * abaixo depende inteiramente do segundo.
 *
 * Recebe `cliente` por prop, como as demais páginas — não importa
 * `shared/config`, o que a mantém testável sem `VITE_URL_API`. Quem decide
 * de onde vem o `Cliente` é `app/rotas/Rotas.tsx`.
 */
export function PaginaBiblioteca({ cliente }: { cliente: Cliente }) {
  const {
    filtro,
    busca,
    definirBusca,
    pagina,
    componentesIds,
    seriesIds,
    metodologiasIds,
    alternarComponente,
    alternarSerie,
    alternarMetodologia,
    irParaPagina,
    limpar,
    temFiltro,
  } = useFiltroPlanos()

  // O vocabulário alimenta os chips. Carrega em paralelo com os planos, e
  // tem cache de uma hora — ver `useVocabulario`.
  const { vocabulario } = useVocabulario(cliente)
  const consulta = usePlanos(cliente, filtro)
  const porPagina = TAMANHO_PAGINA

  const itens = consulta.data?.itens ?? []
  const total = consulta.data?.total ?? 0
  const temPaginaAnterior = pagina > 1
  const temProximaPagina = pagina * porPagina < total

  // O `<main>` do `LayoutPublico` é só o palco, sem largura máxima: é a
  // página que pede a coluna de leitura. Ver `components/container`.
  return (
    <Container className="py-8">
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-[28px]">Biblioteca</h1>
          <p className="text-muted-foreground">
            Prontos para levar para a sala. Filtre por série, componente ou metodologia.
          </p>
        </header>

        <FiltrosPlanos
          pesquisa={busca}
          aoMudarPesquisa={definirBusca}
          vocabulario={vocabulario}
          componentesIds={componentesIds}
          aoAlternarComponente={alternarComponente}
          seriesIds={seriesIds}
          aoAlternarSerie={alternarSerie}
          metodologiasIds={metodologiasIds}
          aoAlternarMetodologia={alternarMetodologia}
          total={total}
          temFiltro={temFiltro}
          aoLimpar={limpar}
        />

        {consulta.isError ? (
          <p role="alert" className="border-2 border-traco bg-err-bg px-4 py-6 text-err">
            {mensagemDe(consulta.error)}
          </p>
        ) : consulta.isPending ? (
          // Sem `role="status"` de propósito: outro provedor já usa esse
          // role para o aviso de expiração, e dois landmarks iguais
          // simultâneos tornam `getByRole('status')` ambíguo em qualquer
          // teste que monte esta página dentro da sessão.
          <p className="px-2 py-6 text-muted-foreground">Carregando planos…</p>
        ) : itens.length === 0 ? (
          <VazioBiblioteca temFiltro={temFiltro} />
        ) : (
          <>
            {/* `ul`/`li` e não um `div` de cards: é uma lista, e o leitor de
                tela anuncia quantos itens são antes de percorrer. A `FichaPlano`
                é um `article`, que aninha dentro do `li` sem conflito. */}
            <ul
              aria-label="Planos de aula"
              className="grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2 xl:grid-cols-3"
            >
              {itens.map((plano) => (
                <li key={plano.id}>
                  <FichaPlano plano={plano} />
                </li>
              ))}
            </ul>

            <nav aria-label="Paginação" className="flex items-center justify-between gap-3 border-t-2 border-traco pt-3">
              <span className="font-mono text-[12px] text-muted-foreground">
                Página {pagina} de {Math.max(1, Math.ceil(total / porPagina))}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!temPaginaAnterior}
                  onClick={() => irParaPagina(pagina - 1)}
                  className="min-h-11 gap-1 rounded-none border-2 border-traco"
                >
                  <CaretLeft size={14} weight="bold" />
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!temProximaPagina}
                  onClick={() => irParaPagina(pagina + 1)}
                  className="min-h-11 gap-1 rounded-none border-2 border-traco"
                >
                  Próxima
                  <CaretRight size={14} weight="bold" />
                </Button>
              </div>
            </nav>
          </>
        )}
      </div>
    </Container>
  )
}

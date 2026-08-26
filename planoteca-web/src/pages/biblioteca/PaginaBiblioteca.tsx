import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft'
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight'
import { useId } from 'react'
import type { Cliente } from '@/shared/api'
import { mensagemDe } from '@/shared/api'
import { FACETAS_VAZIAS, useFacetas, usePlanos } from '@/entities/plano'
import { useVocabulario } from '@/entities/vocabulario'
import { Button } from '@/components/ui/button'
import { CampoBusca } from '@/components/ui/campo-busca'
import {
  GavetaFiltros,
  PainelFiltros,
  SelecaoAtiva,
  TAMANHO_PAGINA,
  useFiltroPlanos,
} from '@/features/filtrar-planos'
import { Container } from '@/components/container'
import { FichaPlano } from './FichaPlano'

/**
 * O estado vazio. Distingue "nada casa com o filtro" de "a biblioteca está
 * vazia": a primeira é um beco com saída (afrouxar o recorte), a segunda
 * não, e um conselho de "limpe os filtros" para quem não filtrou nada só
 * confundiria.
 *
 * **O botão de limpar só aparece quando NADA mais o oferece.** As pílulas da
 * seleção o mostram sempre que há item marcado, e repeti-lo aqui daria a quem
 * usa leitor de tela dois controles indistinguíveis pelo nome. Mas há um caso
 * em que as pílulas não desenham nada e ainda assim existe recorte: um link
 * antigo, com slug em vez de GUID, filtra por um id que não casa com nenhum
 * item do vocabulário. Sem este botão, quem colou esse link fica com uma
 * lista vazia e nenhuma saída além de editar a URL à mão.
 */
function VazioBiblioteca({
  temFiltro,
  temSelecaoVisivel,
  aoLimpar,
}: {
  temFiltro: boolean
  /** Há pílula na tela? Quando há, ela já oferece o "Limpar filtros". */
  temSelecaoVisivel: boolean
  aoLimpar: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 border-2 border-traco bg-card px-6 py-12 text-center">
      <h2 className="text-lg">
        {temFiltro ? 'Nenhum plano com esses filtros' : 'A biblioteca ainda está vazia'}
      </h2>
      <p className="max-w-[46ch] text-muted-foreground">
        {temFiltro
          ? 'Afrouxe o recorte: desligue a série ou o componente, ou busque por um termo mais curto.'
          : 'Assim que os primeiros planos forem publicados, eles aparecem aqui.'}
      </p>
      {temFiltro && !temSelecaoVisivel && (
        <Button
          type="button"
          variant="outline"
          onClick={aoLimpar}
          className="min-h-11 rounded-none border-2 border-traco"
        >
          Limpar filtros
        </Button>
      )}
    </div>
  )
}

/**
 * A Biblioteca — a tela principal da Planoteca, contra
 * `GET /api/v1/lesson-plans`.
 *
 * ── O layout de duas colunas ─────────────────────────────────────────────
 *
 * Na largura cheia o filtro é uma coluna de 272px à esquerda, e os planos
 * ocupam o resto DO TOPO. Antes ele era uma faixa horizontal acima da lista,
 * e o primeiro plano só aparecia depois de uns 300px de chip — num monitor
 * baixo, abaixo da dobra. A coluna resolve isso e escala: quarenta
 * metodologias são rolagem dentro dela, não altura da página.
 *
 * Abaixo de `lg` a coluna não cabe, e vira gaveta (`GavetaFiltros`). A busca
 * NÃO entra na gaveta: ela fica na página, porque digitar é o primeiro gesto
 * de quem chega procurando assunto, e não vale um toque a mais.
 *
 * Os dois painéis existem na árvore ao mesmo tempo, o que faria uma busca por
 * caixa de marcar achar dois elementos. Não faz: a gaveta só monta o painel
 * quando o `Dialog` abre, porque o Radix não renderiza conteúdo fechado.
 *
 * Paginação e filtro são do SERVIDOR — `usePlanos` refaz a busca a cada
 * mudança de `filtro`, e o filtro inteiro vive na URL (`useFiltroPlanos`).
 * Numa biblioteca isso não é detalhe técnico: "manda o link desse filtro"
 * é como um professor passa uma seleção para outro.
 *
 * Duas armadilhas do back-end, ambas absorvidas por `cliente.listar`
 * (`shared/api/cliente.ts`) antes de chegar aqui: a lista vem **204 sem
 * corpo** quando o total é zero, e o total vem no cabeçalho
 * **`X-Total-Count`**, não no corpo. A paginação abaixo depende do segundo.
 *
 * A faixa de contagem lê o total da LISTAGEM, e não das facetas. Os dois
 * números respondem perguntas diferentes: a listagem diz quantos planos a
 * seleção devolve; as facetas dizem quantos cada item devolveria. Um número
 * só na tela, e é o da lista logo abaixo dele.
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

  const idBusca = useId()

  // O vocabulário alimenta os itens. Carrega em paralelo com os planos, e
  // tem cache de uma hora — ver `useVocabulario`.
  const { vocabulario } = useVocabulario(cliente)
  const consulta = usePlanos(cliente, filtro)
  // As contagens por item. Consulta IRMÃ da de planos, com chave própria: as
  // duas respondem perguntas diferentes sobre o mesmo recorte.
  const consultaFacetas = useFacetas(cliente, filtro)
  const facetas = consultaFacetas.data ?? FACETAS_VAZIAS
  const porPagina = TAMANHO_PAGINA

  const itens = consulta.data?.itens ?? []
  const total = consulta.data?.total ?? 0
  const temPaginaAnterior = pagina > 1
  const temProximaPagina = pagina * porPagina < total
  const totalAtivos = componentesIds.length + seriesIds.length + metodologiasIds.length

  // Quantas pílulas o `SelecaoAtiva` desenha DE FATO — a mesma regra dele, e
  // não `totalAtivos`. Um link antigo com slug no lugar do GUID conta como
  // filtro ativo e não casa com nenhum item do vocabulário: a seleção fica
  // sem nada a desenhar, e o estado vazio precisa saber disso para oferecer
  // a saída.
  const temSelecaoVisivel =
    vocabulario.componentes.some((c) => componentesIds.includes(c.id)) ||
    vocabulario.series.some((s) => seriesIds.includes(s.id)) ||
    vocabulario.metodologias.some((m) => metodologiasIds.includes(m.id))

  const propriedadesDoPainel = {
    pesquisa: busca,
    aoMudarPesquisa: definirBusca,
    vocabulario,
    facetas,
    componentesIds,
    aoAlternarComponente: alternarComponente,
    seriesIds,
    aoAlternarSerie: alternarSerie,
    metodologiasIds,
    aoAlternarMetodologia: alternarMetodologia,
  }

  // O `<main>` do `LayoutPublico` é só o palco, sem largura máxima: é a
  // página que pede a coluna de leitura. Ver `components/container`.
  return (
    <Container className="py-8">
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px]">Biblioteca</h1>
          <p className="max-w-[60ch] text-muted-foreground">
            Prontos para levar para a sala. Filtre por série, componente ou metodologia.
          </p>
        </header>

        {/* Breakpoint DESCENDO, como na landing e no Blog: a forma larga é a
            regra, e `max-lg` é a exceção. Misturar as duas direções no mesmo
            repositório é o que faz uma tela destoar da outra sem ninguém
            saber dizer por quê.

            `minmax(0,1fr)` e não `1fr`: sem ele, um título longo de plano
            estoura a coluna, porque o mínimo implícito de uma faixa de grid
            é `auto`, e não zero. */}
        <div className="grid grid-cols-[272px_minmax(0,1fr)] items-start gap-6 max-lg:grid-cols-1">
          {/* A coluna da largura cheia. `aside` e não `div`: é conteúdo
              complementar à lista, e o leitor de tela o anuncia como
              landmark, o que dá um atalho para pular o filtro. */}
          <aside
            aria-label="Filtros"
            className="border-2 border-traco bg-card p-[13px] max-lg:hidden"
          >
            <PainelFiltros {...propriedadesDoPainel} />
          </aside>

          {/* Abaixo de `lg`: a busca na página, a gaveta atrás do botão. */}
          <div className="flex flex-col gap-2 lg:hidden">
            <label htmlFor={idBusca} className="sr-only">
              Buscar por assunto, autoria ou objeto de conhecimento
            </label>
            <CampoBusca
              id={idBusca}
              value={busca}
              onChange={(evento) => definirBusca(evento.target.value)}
              placeholder="Assunto, autoria ou objeto de conhecimento"
            />
            <GavetaFiltros
              {...propriedadesDoPainel}
              totalAtivos={totalAtivos}
              totalPlanos={total}
              aoLimpar={limpar}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <SelecaoAtiva
              vocabulario={vocabulario}
              componentesIds={componentesIds}
              seriesIds={seriesIds}
              metodologiasIds={metodologiasIds}
              aoAlternarComponente={alternarComponente}
              aoAlternarSerie={alternarSerie}
              aoAlternarMetodologia={alternarMetodologia}
              aoLimpar={limpar}
            />

            {/* `bg-inverso-bg`, o token que a landing criou para bloco escuro
                público — hero, faixa do Blog, rodapé. `bg-foreground` era o
                preto de texto usado como fundo, e ficava um tom fora dos
                outros blocos escuros da mesma navegação. */}
            <div className="flex items-center justify-between gap-3 bg-inverso-bg px-[13px] py-2.5 text-inverso-ink">
              {/* `aria-live="polite"`: a contagem muda por causa de um toque
                  em OUTRO elemento, e o foco continua na caixa ou na célula —
                  sem isto, quem usa leitor de tela não saberia que o resultado
                  mudou. */}
              <span aria-live="polite" className="font-mono text-[12.5px] font-semibold">
                {total} {total === 1 ? 'plano' : 'planos'}
              </span>
              <span className="text-[12.5px] font-medium opacity-70">
                ordenados pelos mais recentes
              </span>
            </div>

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
              <VazioBiblioteca
                temFiltro={temFiltro}
                temSelecaoVisivel={temSelecaoVisivel}
                aoLimpar={limpar}
              />
            ) : (
              <>
                {/* `ul`/`li` e não um `div` de cards: é uma lista, e o leitor
                    de tela anuncia quantos itens são antes de percorrer. A
                    `FichaPlano` é um `article`, que aninha dentro do `li` sem
                    conflito.

                    Duas colunas, e não três: com a coluna de filtro comendo
                    272px, uma terceira ficha espremeria o título em quatro
                    linhas. */}
                <ul
                  aria-label="Planos de aula"
                  className="grid list-none grid-cols-2 gap-3 p-0 max-sm:grid-cols-1"
                >
                  {itens.map((plano) => (
                    <li key={plano.id}>
                      <FichaPlano plano={plano} />
                    </li>
                  ))}
                </ul>

                <nav
                  aria-label="Paginação"
                  className="flex items-center justify-between gap-3 border-t-2 border-traco pt-3"
                >
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
        </div>
      </div>
    </Container>
  )
}

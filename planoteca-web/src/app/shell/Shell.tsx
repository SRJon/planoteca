import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router'
import { cn } from '@/shared/lib/cn'
import { BarraLateral } from './BarraLateral'
import { BarraSuperior } from './BarraSuperior'
import { Trilha } from './Trilha'
import { useAutenticacao } from '../providers/AutenticacaoProvider'
import { ITENS_MENU, filtrarMenu } from './permissoes'

const CHAVE_RECOLHIDA = 'csc.barra-lateral-recolhida'

function recolhidaInicial(): boolean {
  try {
    return localStorage.getItem(CHAVE_RECOLHIDA) === '1'
  } catch {
    return false
  }
}

/**
 * O esqueleto visual de toda tela autenticada — barra lateral, barra
 * superior, trilha e o conteúdo da rota (`Outlet`). Vive dentro de
 * `RotaProtegida` (`app/rotas/Rotas.tsx`): quando este componente monta, uma
 * `Sessao` já existe.
 *
 * Porta a estrutura de
 * `prototipo-de-origem/src/components/layout/AppLayout.tsx`, sem o
 * `ChromeContext` inteiro — aquele componente também resolve o portal do
 * `PageHeader`, o sheet da sidebar no mobile e o assistente de chat,
 * nenhum dos três no escopo desta tarefa (nenhuma tela ainda usa
 * `PageHeader`; chat não é uma feature deste projeto). O que falta aqui
 * fica para quem primeiro precisar — o CSS de origem já reserva o
 * breakpoint (`components.css`, bloco "Abaixo daqui a sidebar não cabe").
 */
export function Shell() {
  const [recolhida, setRecolhida] = useState(recolhidaInicial)
  // A gaveta do mobile NÃO reaproveita `recolhida`: são dois conceitos
  // distintos. `recolhida` é a preferência persistida de quem trabalha no
  // desktop com a barra estreita; esta é o estado efêmero de uma gaveta que
  // fecha a cada navegação. Fundir os dois faria a preferência de desktop
  // mudar sozinha ao navegar no celular.
  const [gavetaAberta, setGavetaAberta] = useState(false)
  const { sessao } = useAutenticacao()
  // O menu é estático (`permissoes.ts`) e o filtro é uma leitura de lista —
  // não há rede aqui, e nenhum estado de carregamento a mostrar. O que era
  // uma consulta de duas rotas administrativas virou uma linha.
  const itensMenu = useMemo(() => filtrarMenu(ITENS_MENU, sessao), [sessao])

  // A gravação fica fora do updater do `useState`, não dentro de
  // `alternarSidebar`: em StrictMode o React invoca o updater duas vezes, e
  // um efeito colateral ali dentro gravaria em dobro. Mesmo raciocínio do
  // `ChromeContext` de origem.
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_RECOLHIDA, recolhida ? '1' : '0')
    } catch {
      // Modo anônimo, política de storage bloqueada: a preferência vale só
      // nesta sessão de aba, sem derrubar a aplicação.
    }
  }, [recolhida])

  /**
   * Trava o scroll do DOCUMENTO enquanto o painel estiver montado.
   *
   * `tema.css` define `html, body, #root { height: 100% }` — o que fixa a
   * altura mas não impede o transbordo. Como esta casca usa `h-dvh` e rola
   * por dentro do `<main>`, qualquer diferença entre `100%` e `dvh` sobrava
   * como uma segunda barra, a do navegador, sobre a barra interna. O
   * formulário de catalogar, que é longo, parava no meio da tela com área
   * morta abaixo.
   *
   * A trava mora AQUI, e não em `tema.css`, porque vale só para o painel: as
   * telas públicas rolam pelo documento, como qualquer página de leitura.
   * Por isso a limpeza devolve o valor anterior em vez de assumir um padrão
   * — sair do painel tem de restaurar a Biblioteca ao que ela era.
   */
  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [])

  const alternarSidebar = useCallback(() => setRecolhida((atual) => !atual), [])
  // Navegar fecha a gaveta — sem isto ela ficaria por cima da tela recém
  // aberta, escondendo justamente o que a pessoa foi buscar. O fechamento é
  // do EVENTO (o clique no link, o toque no véu), e não de um efeito que
  // observa `pathname`: reagir à rota dispararia uma renderização em cascata
  // a cada navegação, inclusive no desktop, onde não existe gaveta nenhuma.
  const fecharGaveta = useCallback(() => setGavetaAberta(false), [])
  const abrirGaveta = useCallback(() => setGavetaAberta(true), [])

  return (
    <div
      className={cn(
        // Abaixo de 768px a barra vira gaveta sobreposta e sai da grade —
        // uma coluna de 248px ao lado de um conteúdo de 390px não deixa
        // espaço para nada.
        'grid h-dvh grid-cols-[248px_1fr] grid-rows-[auto_auto_1fr] overflow-hidden max-md:grid-cols-[1fr]',
        recolhida && 'grid-cols-[72px_1fr]',
      )}
    >
      <BarraLateral
        recolhida={recolhida}
        aoAlternar={alternarSidebar}
        itensMenu={itensMenu}
        abertaNoMobile={gavetaAberta}
        aoFecharNoMobile={fecharGaveta}
      />
      <BarraSuperior aoAbrirMenu={abrirGaveta} />
      <Trilha />
      {/* Sem raio e sem margem lateral: na direção B o conteúdo é o PAPEL,
          não um cartão flutuando sobre um fundo. O `rounded-b-xl` e a
          moldura que o boilerplate trazia desenhavam uma segunda caixa em
          volta de uma tela que já é desenhada em blocos de traço. */}
      <main className="col-start-2 col-end-3 row-start-3 row-end-4 max-md:col-start-1 max-md:col-end-2 min-h-0 overflow-auto bg-painel px-6 py-6 pb-9">
        <Outlet />
      </main>
    </div>
  )
}

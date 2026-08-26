import { useState } from 'react'
import type { ContagemFaceta } from '@/entities/plano'
import { classeCorComponente } from '@/entities/vocabulario'
import { Button } from '@/components/ui/button'
import { CaixaMarcar } from '@/components/ui/caixa-marcar'

/** Quantos itens o grupo mostra antes de dobrar (RF-07). Oito é o que cabe
 * na coluna sem obrigar rolagem dentro dela numa tela de 1080px de altura. */
const LIMITE = 8

/** O que um item precisa ter para entrar no grupo. `sigla` e `cor` só o
 * componente tem — a metodologia não carrega bloco colorido. */
export type ItemFiltro = {
  id: string
  nome: string
  sigla?: string
  /** O token de cor do tema. O tipo é o mesmo que `classeCorComponente`
   * consome, então um `Componente` do vocabulário JÁ satisfaz `ItemFiltro`
   * — o painel passa a lista da API sem mapear campo a campo. */
  cor?: string
}

interface GrupoFiltroProps {
  titulo: string
  itens: ItemFiltro[]
  selecionados: string[]
  contagens: ContagemFaceta[]
  aoAlternar: (id: string) => void
  /** Desenha o bloco de sigla colorido à esquerda do nome. Só componente
   * curricular o tem: é a assinatura que a ficha do plano já usa. */
  comSigla?: boolean
}

/**
 * Um grupo da coluna de filtro: componente ou metodologia.
 *
 * **Por que `details`/`summary`, e não um botão com estado.** Dobrar é
 * exatamente o que o elemento faz, com teclado, com leitor de tela e sem
 * JavaScript. Reimplementá-lo custaria `aria-expanded`, `aria-controls` e o
 * tratamento de Enter e Espaço — três coisas para errar num comportamento
 * que o navegador já entrega correto.
 *
 * **Por que a contagem fica em mono, à direita.** Ela é número, e alinhada
 * à direita em fonte de largura fixa a coluna de números lê como coluna. Em
 * fonte proporcional, "12" e "9" desalinham e a leitura vertical se perde.
 *
 * **Por que o item com zero continua clicável.** Desabilitá-lo esconderia
 * que o componente existe no acervo. O zero informa; o item apagado só
 * confunde.
 *
 * O estado do "mais" é LOCAL. Ele não descreve o recorte, e sim quanto da
 * lista está à vista — pô-lo na URL faria "manda o link desse filtro"
 * carregar uma preferência de tela junto com a seleção.
 */
export function GrupoFiltro({
  titulo,
  itens,
  selecionados,
  contagens,
  aoAlternar,
  comSigla = false,
}: GrupoFiltroProps) {
  const [expandido, definirExpandido] = useState(false)

  if (itens.length === 0) return null

  const totalPorId = new Map(contagens.map((c) => [c.id, c.total]))
  const escondidos = itens.length - LIMITE

  // Item marcado aparece SEMPRE, mesmo fora dos oito primeiros (RF-07):
  // esconder o que a pessoa acabou de marcar faria a seleção parecer
  // perdida, e o clique de desmarcar deixaria de ter alvo.
  const visiveis = expandido
    ? itens
    : itens.filter((item, indice) => indice < LIMITE || selecionados.includes(item.id))

  return (
    <details open className="border-t-2 border-traco pt-[11px]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1">
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {titulo} <span className="font-normal normal-case">· {itens.length}</span>
        </span>
      </summary>

      <ul className="mt-[7px] flex list-none flex-col p-0">
        {visiveis.map((item) => (
          <li key={item.id}>
            {/* O `label` embrulha a caixa: o alvo de toque passa a ser a
                linha inteira, e não o quadrado de 16px. Num celular, essa é
                a diferença entre marcar e errar. */}
            <label className="flex min-h-11 cursor-pointer items-center gap-2 py-1 text-[13.5px] hover:bg-muted">
              <CaixaMarcar
                checked={selecionados.includes(item.id)}
                onChange={() => aoAlternar(item.id)}
              />
              {/* A MESMA receita de `CardArea.tsx`, à letra: `size-7`,
                  `place-items-center`, `text-xs`. O bloco de sigla é a
                  assinatura da direção, e assinatura que muda de tamanho
                  entre telas deixa de ser assinatura. `aria-hidden` porque a
                  sigla é pista VISUAL redundante — o nome por extenso vem na
                  mesma linha, e um leitor de tela que anunciasse "MA,
                  Matemática" leria duas vezes o mesmo. */}
              {comSigla && (
                <span
                  aria-hidden
                  className={`grid size-7 flex-none place-items-center font-display text-xs font-bold text-comp-texto ${classeCorComponente(
                    item.cor ? { cor: item.cor } : null,
                  )}`}
                >
                  {item.sigla}
                </span>
              )}
              <span className="grow truncate">{item.nome}</span>
              <span className="shrink-0 font-mono text-[11.5px] text-muted-foreground tabular-nums">
                {totalPorId.get(item.id) ?? 0}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {escondidos > 0 && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => definirExpandido((atual) => !atual)}
          className="min-h-11 rounded-none px-0 text-[12px] font-bold text-accent hover:bg-transparent hover:text-accent hover:underline"
        >
          {expandido ? 'Mostrar menos' : `mais ${escondidos}`}
        </Button>
      )}
    </details>
  )
}

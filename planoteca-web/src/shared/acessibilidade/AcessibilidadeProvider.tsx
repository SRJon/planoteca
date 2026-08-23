import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Os quatro degraus de tamanho de texto.
 *
 * São multiplicadores do tamanho base, aplicados como `font-size` na raiz —
 * e não como classe em cada componente. Toda medida tipográfica do tema está
 * em `rem`, então mexer na raiz escala texto, espaçamento interno e altura de
 * linha juntos, mantendo a proporção do desenho. Trocar tamanho componente a
 * componente daria texto grande dentro de caixa pequena.
 *
 * O teto é 1.5. Acima disso a grade da Biblioteca quebra em telas estreitas —
 * e quem precisa de mais do que isso é atendido melhor pelo zoom do navegador,
 * que escala a página inteira, imagem inclusive.
 */
export const ESCALAS = [1, 1.15, 1.3, 1.5] as const
export type Escala = (typeof ESCALAS)[number]

export type PreferenciasAcessibilidade = {
  /** Multiplicador do tamanho de texto. 1 é o padrão do desenho. */
  escala: Escala
  /** Paleta de contraste reforçado. Ver `tema.css`, bloco `.alto-contraste`. */
  altoContraste: boolean
  /** Suprime transição e animação. Espelha `prefers-reduced-motion`. */
  menosMovimento: boolean
  /** Sublinha todo link no corpo do texto, não só no hover. */
  sublinharLinks: boolean
}

const PADRAO: PreferenciasAcessibilidade = {
  escala: 1,
  altoContraste: false,
  menosMovimento: false,
  sublinharLinks: false,
}

const CHAVE = 'planoteca.acessibilidade'

type ContextoAcessibilidade = {
  preferencias: PreferenciasAcessibilidade
  definir: <C extends keyof PreferenciasAcessibilidade>(
    campo: C,
    valor: PreferenciasAcessibilidade[C],
  ) => void
  restaurarPadrao: () => void
  /** Verdadeiro quando alguma preferência difere do padrão. */
  alterado: boolean
}

const Contexto = createContext<ContextoAcessibilidade | null>(null)

/**
 * Lê o que foi gravado, campo a campo.
 *
 * Valida cada um em vez de confiar no formato: o conteúdo de `localStorage`
 * sobrevive a deploys, e uma versão futura que remova um degrau de escala
 * encontraria aqui o valor antigo. Campo inválido cai no padrão, em vez de
 * derrubar a aplicação inteira na primeira renderização.
 */
function gravadas(): PreferenciasAcessibilidade {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (!bruto) return PADRAO
    const lido: unknown = JSON.parse(bruto)
    if (typeof lido !== 'object' || lido === null) return PADRAO
    const registro = lido as Record<string, unknown>
    const escala = registro.escala
    return {
      escala: ESCALAS.includes(escala as Escala) ? (escala as Escala) : PADRAO.escala,
      altoContraste:
        typeof registro.altoContraste === 'boolean' ? registro.altoContraste : PADRAO.altoContraste,
      menosMovimento:
        typeof registro.menosMovimento === 'boolean'
          ? registro.menosMovimento
          : PADRAO.menosMovimento,
      sublinharLinks:
        typeof registro.sublinharLinks === 'boolean'
          ? registro.sublinharLinks
          : PADRAO.sublinharLinks,
    }
  } catch {
    return PADRAO
  }
}

/**
 * O sistema operacional também pede menos movimento?
 *
 * `prefers-reduced-motion` já é respeitado por `tema.css`. Esta consulta serve
 * para o estado INICIAL do controle refletir a verdade: se o sistema já pede
 * movimento reduzido, a chave nasce ligada, em vez de mostrar "desligado"
 * enquanto a página não anima nada.
 */
function sistemaPedeMenosMovimento(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

/**
 * As preferências de leitura, escolhidas por quem usa e guardadas no navegador.
 *
 * ── Por que existe, se o navegador já tem zoom ──────────────────────────
 *
 * O `Ctrl` + `+` escala a página inteira e continua sendo a ferramenta mais
 * completa. Mas ele é invisível: quem não sabe do atalho não descobre que
 * existe. Um controle na barra ensina que a opção está lá, e é essa a razão
 * de ele existir — o público da Planoteca inclui professor que não cresceu
 * com o atalho na mão.
 *
 * Os outros três controles o zoom NÃO resolve: contraste, movimento e
 * sublinhado de link não têm atalho de teclado em navegador nenhum.
 *
 * ── Como aplica ────────────────────────────────────────────────────────
 *
 * Tudo vira atributo ou variável no elemento raiz, e o CSS reage. Nenhum
 * componente lê este contexto para se desenhar — se lesse, cada tela nova
 * precisaria lembrar de fazê-lo, e a que esquecesse ficaria de fora. A regra
 * é a mesma do tema, que aplica só a classe `.dark`.
 *
 * `localStorage`, como o tema: é preferência do computador, não da conta, e
 * precisa sobreviver ao logout. Quem baixa plano sem entrar é justamente o
 * público principal.
 */
export function AcessibilidadeProvider({ children }: { children: ReactNode }) {
  const [preferencias, setPreferencias] = useState<PreferenciasAcessibilidade>(() => {
    const guardadas = gravadas()
    // Sem nada gravado, o pedido do sistema decide o movimento. Uma escolha
    // explícita anterior vence — inclusive a de MANTER o movimento.
    return localStorage.getItem(CHAVE) === null
      ? { ...guardadas, menosMovimento: sistemaPedeMenosMovimento() }
      : guardadas
  })

  useEffect(() => {
    const raiz = document.documentElement
    // A escala vira `font-size` da raiz: 16px é o padrão do navegador, e é o
    // que a escala 1 preserva. Quem aumentou a fonte padrão do navegador
    // continua sendo respeitado, porque o cálculo parte de `100%`.
    raiz.style.fontSize = preferencias.escala === 1 ? '' : `${preferencias.escala * 100}%`
    raiz.classList.toggle('alto-contraste', preferencias.altoContraste)
    raiz.classList.toggle('menos-movimento', preferencias.menosMovimento)
    raiz.classList.toggle('sublinhar-links', preferencias.sublinharLinks)
  }, [preferencias])

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(preferencias))
    } catch {
      // Modo anônimo ou armazenamento cheio: vale só nesta aba.
    }
  }, [preferencias])

  const definir = useCallback<ContextoAcessibilidade['definir']>((campo, valor) => {
    setPreferencias((atual) => ({ ...atual, [campo]: valor }))
  }, [])

  const restaurarPadrao = useCallback(() => {
    setPreferencias(PADRAO)
  }, [])

  const alterado = useMemo(
    () =>
      preferencias.escala !== PADRAO.escala ||
      preferencias.altoContraste !== PADRAO.altoContraste ||
      preferencias.menosMovimento !== PADRAO.menosMovimento ||
      preferencias.sublinharLinks !== PADRAO.sublinharLinks,
    [preferencias],
  )

  const valor = useMemo(
    () => ({ preferencias, definir, restaurarPadrao, alterado }),
    [preferencias, definir, restaurarPadrao, alterado],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAcessibilidade(): ContextoAcessibilidade {
  const contexto = useContext(Contexto)
  if (!contexto) {
    throw new Error('useAcessibilidade precisa de um AcessibilidadeProvider acima na árvore.')
  }
  return contexto
}

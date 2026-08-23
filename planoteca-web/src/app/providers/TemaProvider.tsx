import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Tema = 'light' | 'dark'

const CHAVE_TEMA = 'csc.tema'

type ContextoTema = {
  tema: Tema
  alternarTema: () => void
}

const Contexto = createContext<ContextoTema | null>(null)

function temaGravado(): Tema | null {
  try {
    const valor = localStorage.getItem(CHAVE_TEMA)
    return valor === 'dark' || valor === 'light' ? valor : null
  } catch {
    return null
  }
}

/**
 * `matchMedia` não existe no jsdom, e some em qualquer ambiente sem DOM
 * completo. Antes ele só era chamado dentro de um efeito, e a ausência
 * passava batida; agora decide o estado inicial. Sem preferência legível, o
 * claro é o padrão — é o que `tokens.css` define em `:root`.
 */
function consultaEscuro(): MediaQueryList | null {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null
}

function preferenciaDoSistema(): Tema {
  return consultaEscuro()?.matches ? 'dark' : 'light'
}

/**
 * Aplica a classe `.dark` (claro/escuro) no elemento raiz — o seletor que o
 * shadcn espera (`@custom-variant dark` em `tema.css`).
 *
 * A escolha explícita do usuário VENCE a preferência do sistema, e persiste
 * em `localStorage`. Sem escolha gravada, segue o sistema e continua seguindo
 * enquanto a aplicação estiver aberta.
 *
 * ## O que estava quebrado antes
 *
 * Este provedor só lia `prefers-color-scheme` e reescrevia o tema a cada
 * mudança dele. A `BarraSuperior` tinha um botão que escrevia o estado
 * direto no DOM — então a troca manual funcionava até o sistema mudar de
 * tema, e sumia em qualquer recarga. Dois donos do mesmo estado, nenhum
 * deles guardando nada. Agora o dono é um só, e o botão pede a troca por
 * `alternarTema`.
 *
 * `localStorage`, não `sessionStorage`: tema é preferência de quem usa aquele
 * computador e não tem leitura de dado nenhum, então sobreviver ao logout é o
 * comportamento desejado.
 *
 * Escreve só a classe `.dark` no elemento raiz — sem classe, é o claro. Este
 * boilerplate não tem dimensão de empresa — `tema.css` define uma paleta
 * só, a do tema.
 */
export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => temaGravado() ?? preferenciaDoSistema())

  // Guarda se a escolha foi do usuário. Sem isto não dá para distinguir "está
  // escuro porque o sistema está escuro" de "está escuro porque escolheram" —
  // e a diferença decide se a mudança do SO deve ou não sobrepor.
  const [escolhido, setEscolhido] = useState(() => temaGravado() !== null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark')
  }, [tema])

  useEffect(() => {
    if (escolhido) return
    const consulta = consultaEscuro()
    if (!consulta) return
    function aoMudar(evento: MediaQueryListEvent) {
      setTema(evento.matches ? 'dark' : 'light')
    }
    consulta.addEventListener('change', aoMudar)
    return () => consulta.removeEventListener('change', aoMudar)
  }, [escolhido])

  const alternarTema = useCallback(() => {
    setTema((atual) => {
      const proximo: Tema = atual === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(CHAVE_TEMA, proximo)
      } catch {
        // Modo anônimo: vale só nesta sessão de aba.
      }
      return proximo
    })
    setEscolhido(true)
  }, [])

  const valor = useMemo(() => ({ tema, alternarTema }), [tema, alternarTema])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useTema(): ContextoTema {
  const contexto = useContext(Contexto)
  if (!contexto) {
    throw new Error('useTema precisa de um TemaProvider acima na árvore.')
  }
  return contexto
}

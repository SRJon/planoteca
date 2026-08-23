import { useEffect, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { CamposCatalogar } from './useCatalogarPlano'

/** A chave do rascunho no `localStorage`. Uma só: só existe um formulário de
 * catalogação aberto por vez. */
export const CHAVE_RASCUNHO = 'planoteca.catalogar.rascunho'

/** Espera este tanto de silêncio antes de gravar. Gravar a cada tecla
 * pressionada custa uma serialização inteira do formulário a cada letra —
 * o debounce é o que evita isso sem perder nada: quem digita rápido só
 * atrasa a gravação, nunca a perde. */
const ATRASO_MS = 500

/** Lê o rascunho gravado, se houver. `try/catch` porque modo anônimo (e
 * qualquer navegador com armazenamento bloqueado) lança ao tocar em
 * `localStorage`, e a leitura do rascunho não pode derrubar a tela. */
function lerRascunho(): CamposCatalogar | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE_RASCUNHO)
    if (!bruto) return null
    return JSON.parse(bruto) as CamposCatalogar
  } catch {
    return null
  }
}

function gravarRascunho(campos: CamposCatalogar) {
  try {
    window.localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(campos))
  } catch {
    // Modo anônimo ou armazenamento cheio: o rascunho não é essencial ao
    // envio, só uma conveniência. Falhar em silêncio é o comportamento
    // certo aqui — não há erro para mostrar que a pessoa possa agir sobre.
  }
}

export function limparRascunho() {
  try {
    window.localStorage.removeItem(CHAVE_RASCUNHO)
  } catch {
    // mesma razão de `gravarRascunho`
  }
}

/**
 * O rascunho da catalogação em `localStorage`.
 *
 * Não restaura em silêncio: ao montar, se existe um rascunho gravado, o
 * hook só o EXPÕE (`rascunhoDisponivel`). Quem abre decide retomar ou
 * descartar — um formulário que muda sozinho debaixo da pessoa é pior que
 * um formulário vazio.
 *
 * O arquivo (`File`) nunca entra aqui: `File` não serializa em JSON. Ao
 * retomar, a interface avisa que o PDF precisa ser escolhido de novo — ver
 * `FormularioCatalogar`.
 */
export function useRascunho(form: UseFormReturn<CamposCatalogar>) {
  // Inicializador preguiçoso, não `useEffect` + `setState`: a leitura só
  // precisa rodar UMA vez, na primeira renderização, e não é sincronização
  // com nada externo que mude depois — é exatamente o caso que a regra
  // `react-hooks/set-state-in-effect` pede para tirar do efeito.
  const [rascunho] = useState<CamposCatalogar | null>(() => lerRascunho())
  const [oferecido, setOferecido] = useState(() => rascunho !== null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const assinatura = form.watch((valores) => {
      if (temporizador.current) clearTimeout(temporizador.current)
      temporizador.current = setTimeout(() => {
        gravarRascunho(valores as CamposCatalogar)
      }, ATRASO_MS)
    })
    return () => {
      assinatura.unsubscribe()
      if (temporizador.current) clearTimeout(temporizador.current)
    }
  }, [form])

  function retomar() {
    if (rascunho) form.reset(rascunho)
    setOferecido(false)
  }

  function descartar() {
    limparRascunho()
    setOferecido(false)
  }

  return { rascunhoDisponivel: oferecido, retomar, descartar }
}

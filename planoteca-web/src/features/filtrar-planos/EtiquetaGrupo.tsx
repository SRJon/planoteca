/** O rótulo em mono, caixa alta e espacejado que a direção usa nas seções.
 * Saiu de dentro de `FiltrosPlanos.tsx` quando o painel virou três
 * componentes: os três precisam do mesmo rótulo, e uma cópia em cada um
 * divergiria no primeiro ajuste de espacejamento. */
export function EtiquetaGrupo({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
      {children}
    </span>
  )
}

import { cn } from '@/shared/lib/cn'

/**
 * A marca da Planoteca: três formas chapadas em compasso — barra, quadrado e
 * círculo.
 *
 * O desenho é a assinatura da direção B em miniatura. As três formas são as
 * mesmas do bloco de componente curricular do card: geometria primária, sem
 * contorno, sem raio, sem gradiente. Um símbolo de traço fino aqui brigaria
 * com a página inteira, que é desenhada em bloco.
 *
 * As proporções vêm de `design/DirecaoB.dc.html`, e as cores são as três da
 * paleta que carregam identidade: caneta na barra, mimeógrafo no quadrado,
 * tinta no círculo.
 */
export function Marca({
  tamanho = 26,
  /**
   * `cor` pinta com os tokens da paleta — serve sobre papel claro.
   * `solido` herda o `currentColor`, para fundo escuro (barra lateral,
   * painel de entrada), onde a caneta some contra a superfície. No sólido as
   * três formas viram uma só cor, e o que distingue a marca passa a ser a
   * composição, não a paleta.
   */
  tom = 'solido',
  className,
}: {
  tamanho?: number
  tom?: 'cor' | 'solido'
  className?: string
}) {
  const barra = tom === 'cor' ? 'fill-caneta-500' : 'fill-current'
  const quadrado = tom === 'cor' ? 'fill-mimeo-500' : 'fill-current'
  const disco = tom === 'cor' ? 'fill-tinta-900' : 'fill-current'

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn('flex-none', className)}
    >
      <rect x="2.5" y="3" width="8" height="18" className={barra} />
      <rect x="12.5" y="3" width="9" height="9" className={quadrado} />
      <circle cx="17" cy="17" r="4.5" className={disco} />
    </svg>
  )
}

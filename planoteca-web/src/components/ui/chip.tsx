import * as React from 'react'

import { cn } from '@/shared/lib/cn'

/**
 * O chip de filtro da Planoteca: alvo de 44px, traço de 2px, canto vivo.
 *
 * **Por que não é o `Button` com classes por cima.** O `cva` do `Button`
 * traz `rounded-lg`, `h-8` e uma escala de tamanho inteira que a direção B
 * contradiz em cada eixo (`app/estilos/tema.css`: raio zero, alvo de 44px,
 * traço estrutural). Sobrescrever tudo isso classe a classe deixaria o
 * resultado dependendo da ordem de resolução do Tailwind — o tipo de
 * acoplamento que quebra em silêncio na próxima atualização do shadcn.
 *
 * **Por que mora aqui, em `components/ui/`.** É onde o sistema de design
 * mora, ao lado do que o shadcn instala, e é o único lugar onde
 * `react/forbid-elements` permite o `<button>` cru — a regra existe para
 * cobrar o componente do sistema nas telas, e este É o componente do
 * sistema. Uma cópia dele dentro de `features/` seria a própria dívida que
 * a regra evita.
 *
 * O estado ativo é a CANETA sólida — a cor de seleção do sistema. Não a
 * terracota: essa é a ação ("baixar plano"), e um chip não é ação.
 */
function Chip({
  ativo = false,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  /** Ligado? Vira `aria-pressed`, e não `aria-selected`: o chip é um
   * interruptor de duas posições, e continua coerente quando nenhum está
   * ligado. `aria-selected` pertence a uma lista de opções com dono único,
   * o que a grade de filtro não é — nada obriga um componente a estar
   * escolhido. */
  ativo?: boolean
}) {
  return (
    <button
      type="button"
      data-slot="chip"
      aria-pressed={ativo}
      className={cn(
        'min-h-11 border-2 border-traco px-1.5 py-2.5 text-center text-[13px] font-semibold transition-colors',
        ativo ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted',
        className,
      )}
      {...props}
    />
  )
}

export { Chip }

import * as React from 'react'

import { cn } from '@/shared/lib/cn'

/**
 * A caixa de marcar da Planoteca: quadrado de traço, canto vivo, sem raio.
 *
 * **Por que não é o `Checkbox` do shadcn.** Ele não está instalado, e o que
 * a CLI instalaria traz `rounded-sm` e um `data-state` desenhado com ícone
 * embutido — a direção B pede o quadrado nu de 2px, e o `accent-color`
 * nativo resolve o preenchimento sem SVG nem estado em JavaScript.
 *
 * **Por que mora aqui.** É o único lugar onde `react/forbid-elements`
 * permite o `<input>` cru, e é a mesma razão de `Chip` e `CampoBusca`
 * morarem ao lado: a regra existe para cobrar o componente do sistema nas
 * telas, e este é o componente do sistema.
 *
 * `accent-primary` pinta o quadrado marcado com a cor de seleção do tema.
 * `appearance-none` fica de FORA de propósito: sem a aparência nativa, o
 * indicador de marcado teria de ser desenhado à mão, e o modo de alto
 * contraste do sistema operacional deixaria de o reconhecer.
 */
function CaixaMarcar({ className, ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
  return (
    <input
      type="checkbox"
      data-slot="caixa-marcar"
      className={cn(
        'size-4 shrink-0 accent-primary outline-offset-2 focus-visible:outline-3 focus-visible:outline-ring',
        className,
      )}
      {...props}
    />
  )
}

export { CaixaMarcar }

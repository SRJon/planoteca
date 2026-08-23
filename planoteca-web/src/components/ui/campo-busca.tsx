import * as React from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'

import { cn } from '@/shared/lib/cn'

/**
 * O campo de busca da Planoteca: lupa dentro da moldura, traço de 2px,
 * canto vivo.
 *
 * Como o `Chip`, não é o `Input` do shadcn com classes por cima: aquele
 * traz `rounded-lg` e `h-8`, e a direção B pede canto vivo e alvo alto.
 * Mora em `components/ui/` porque é o componente do sistema — o único lugar
 * onde `react/forbid-elements` permite o `<input>` cru, e o lugar de onde
 * as telas devem importá-lo.
 *
 * **O traço é do CONTÊINER, não do `input`.** A lupa fica dentro da
 * moldura; um traço no `input` desenharia uma segunda caixa em volta do
 * campo, dentro da primeira. Por isso o foco também é do contêiner
 * (`focus-within`) e o `input` zera o próprio (`outline-none`) — sem esse
 * par, o navegador desenharia dois anéis concêntricos.
 */
function CampoBusca({
  className,
  ...props
}: Omit<React.ComponentProps<'input'>, 'type'>) {
  return (
    <div className="flex items-center gap-[9px] border-2 border-traco bg-card px-[13px] py-3 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ring">
      <MagnifyingGlass size={17} weight="bold" className="shrink-0 text-muted-foreground" />
      <input
        type="search"
        data-slot="campo-busca"
        className={cn(
          'w-full bg-transparent text-[14.5px] outline-none placeholder:text-muted-foreground',
          className,
        )}
        {...props}
      />
    </div>
  )
}

export { CampoBusca }

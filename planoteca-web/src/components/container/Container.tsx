import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * A coluna de 1180px em que o conteúdo das telas públicas vive.
 *
 * Ela morava no `<main>` do `LayoutPublico`, e isso prendia TODA página à
 * coluna. A landing precisa de hero e rodapé sangrando a largura da janela,
 * o que não cabe num pai com `max-w`. O `main` passou a ser só o palco;
 * cada página decide o que sangra e o que fica na coluna, envolvendo o que
 * fica com este componente.
 *
 * As medidas são as mesmas de antes — 1180px, goteira de 24px que vira 16px
 * no estreito — para que Biblioteca e Blog não mudem de lugar.
 */
export function Container({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('mx-auto w-full max-w-[1180px] px-6 max-md:px-4', className)}
      {...props}
    />
  )
}

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/shared/lib/cn"
import { Button } from "@/components/ui/button"
import { XIcon } from "@phosphor-icons/react"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-overlay duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * Os dois pousos possíveis de um `DialogContent`: no centro, ou colado no
 * rodapé como gaveta.
 *
 * **Por que uma variante, e não uma classe passada por fora.** A gaveta já
 * foi uma constante exportada daqui, sobreposta ao base pelo `className`.
 * Não funcionava: o `cn()` deste projeto é `join(' ')`, sem tailwind-merge,
 * e por isso NÃO deduplica utilitário conflitante. Uma classe de fora não
 * vence a do base por vir depois no atributo — quem decide é a ordem no CSS
 * gerado. O `left-0` da gaveta perdia para o `left-1/2` daqui enquanto o
 * `translate-x-0` ganhava do `-translate-x-1/2`, e o resultado era uma
 * gaveta aberta meia tela à direita, com o botão de aplicar fora do
 * viewport (`e2e/biblioteca.spec.ts`, "a gaveta ocupa a largura da tela").
 *
 * Com a variante os dois posicionamentos são exclusivos por construção: o
 * `left-1/2` do centro nunca chega ao DOM da gaveta, e não há disputa de
 * cascata para perder.
 *
 * **Por que continua sem componente próprio.** O Radix já entrega o que a
 * gaveta precisa — foco preso, Escape, `aria-modal`, retorno do foco ao
 * gatilho. O que muda é só geometria: onde a caixa encosta e por onde ela
 * entra. Isso não justifica uma segunda árvore de componentes a manter em
 * paralelo, nem `vaul` no `package.json`.
 *
 * As anulações da gaveta desfazem padrões do shadcn que a direção B
 * contradiz (`Docs/lessons.md`, 2026-08-23):
 *
 * - `rounded-none` contra o `rounded-xl` de fábrica — raio zero é a direção.
 * - `border-t-2 border-traco` no lugar do `ring-1` — a elevação aqui é
 *   traço, não anel difuso.
 *
 * `max-h-[85svh]` e não `h-full`: `svh` acompanha a barra do navegador
 * móvel, que `vh` ignora — com `vh`, o rodapé de "Ver N planos" ficaria
 * debaixo da barra do Safari. Os 15% restantes mostram a lista por trás, o
 * que diz de onde a gaveta veio.
 */
const POSICAO = {
  centro:
    "top-1/2 left-1/2 max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 ring-1 ring-foreground/10 sm:max-w-sm data-open:zoom-in-95 data-closed:zoom-out-95",
  /** Colada no rodapé, largura cheia — o filtro no celular. */
  gaveta:
    "top-auto bottom-0 left-0 max-h-[85svh] max-w-full grid-rows-[auto_1fr_auto] gap-0 overflow-y-auto rounded-none border-t-2 border-traco bg-card p-0 ring-0 data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
} as const

function DialogContent({
  className,
  children,
  showCloseButton = true,
  variante = "centro",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  variante?: keyof typeof POSICAO
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed z-50 grid w-full text-sm text-popover-foreground duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
          POSICAO[variante],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            >
              <XIcon
              />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}

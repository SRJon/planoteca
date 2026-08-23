/**
 * Junta classes ignorando falsy. Substitui `clsx` sem trazer dependência.
 *
 * Porta byte a byte `prototipo-de-origem/src/lib/cn.ts` — usado por todo
 * `shared/ui` para compor a classe do CSS Module com variantes condicionais.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

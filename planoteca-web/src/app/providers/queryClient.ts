import { QueryClient } from '@tanstack/react-query'

/**
 * Instância única do cliente de consultas (TanStack Query) da aplicação
 * inteira. Precisa ser criada uma vez fora do ciclo de render — recriá-la a
 * cada montagem de `<App>` descartaria o cache a cada re-render do
 * componente pai (não deveria acontecer, mas um `useMemo` sem isto é uma
 * armadilha à espreita; uma constante de módulo não deixa a dúvida existir).
 */
export const queryClient = new QueryClient()

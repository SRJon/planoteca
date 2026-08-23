import { lerAmbiente } from './ambiente'

export type { Ambiente, ConfigFirebase } from './ambiente'
export const ambiente = lerAmbiente(import.meta.env as Record<string, string | undefined>)

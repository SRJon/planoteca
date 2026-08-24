export type { Componente, Serie, Metodologia, Vocabulario } from './modelo'
export { VOCABULARIO_VAZIO, CORES_COMPONENTE, classeCorComponente, agruparPorArea } from './modelo'
export { buscarVocabulario, buscarVocabularioAdmin } from './api'
export type {
  ComponenteEntrada,
  SerieEntrada,
  MetodologiaEntrada,
} from './api'
export {
  useVocabulario,
  useVocabularioAdmin,
  useSalvarComponente,
  useSalvarSerie,
  useSalvarMetodologia,
  CHAVE_VOCABULARIO,
  CHAVE_VOCABULARIO_ADMIN,
} from './useVocabulario'

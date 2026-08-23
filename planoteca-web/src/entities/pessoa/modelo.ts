/**
 * Domínio de pessoa — a fatia de exemplo do boilerplate, contra
 * `GET /api/v1/person-samples`. Os nomes de campo são os do domínio, não os
 * do DTO gerado (`PersonSampleDto`): a tradução acontece em `mapeador.ts`, a
 * única peça deste pacote que conhece o formato de fio.
 */
export type Pessoa = {
  id: string
  nome: string
  /** `null` quando o back-end omite `lastName` do JSON — o campo não tem
   * `[Required]` no DTO, e o `Program.cs` roda com
   * `DefaultIgnoreCondition = WhenWritingNull`, então sobrenome ausente
   * some do corpo em vez de virar `null` explícito. */
  sobrenome: string | null
  /** `nome` sozinho, ou `nome` + `sobrenome` quando os dois existem. */
  nomeCompleto: string
  /** Data de nascimento, no fuso de Brasília (o DTO não traz offset —
   * `shared/lib/data.deApi` decide o instante). */
  nascimento: Date
  /**
   * Tradução de `PersonTypeSample` ("MALE" | "FEMALE") para português — a
   * convenção deste domínio é nomes em português (ver `entities/autenticacao`).
   * Quem adota o boilerplate para um domínio sem gênero binário troca este
   * campo por outra coisa; a tradução aqui é só o exemplo mais direto de
   * "o mapeador normaliza vocabulário de fio para vocabulário de domínio".
   */
  tipo: 'masculino' | 'feminino'
  ativo: boolean
  idade: number
}

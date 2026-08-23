import type { components } from '@/shared/api/schema'
import { deApi } from '@/shared/lib/data'
import type { Pessoa } from './modelo'

/**
 * Anti-corrupção entre `PersonSampleDto` (`GET /api/v1/person-samples`,
 * `contracts/openapi-v1.json`) e o domínio `Pessoa`. Este é o ÚNICO arquivo
 * da fatia — e um dos dois do projeto inteiro, ao lado de `app/shell/
 * permissoes.ts` — que importa `schema.d.ts`. Todo consumidor downstream
 * enxerga `Pessoa`; o dia em que o back-end mudar o DTO, o custo é este
 * arquivo, não uma varredura.
 *
 * Um defeito conhecido do DTO que a tradução absorve:
 *
 * `lastName` pode sumir do JSON. O `Program.cs` roda com
 * `DefaultIgnoreCondition = WhenWritingNull`, e `LastName` não tem
 * `[Required]` no record — campo nulo some do corpo em vez de virar `null`
 * explícito. Dos sete campos do DTO, é o único que se comporta assim: os
 * outros seis são tipo de valor ou `string` `[Required]`, nunca ausentes.
 */
export type PessoaApi = components['schemas']['PersonSampleDto']

/** `id` é `Guid` e obrigatório no C# — nunca ausente por contrato. Lança se
 * vier vazio: um `id` ilegível não é uma pessoa "sem identidade", é uma
 * resposta corrompida, na mesma lógica que `codigo` em `entities/projeto`. */
function idOuFalha(valor: string): string {
  if (valor.trim() === '') throw new Error('campo obrigatório "id" veio vazio')
  return valor
}

function paraNomeCompleto(nome: string, sobrenome: string | null): string {
  return sobrenome === null ? nome : `${nome} ${sobrenome}`
}

/**
 * "MALE" | "FEMALE" → "masculino" | "feminino". O `type` do DTO é
 * `PersonTypeSample`, serializado como texto pelo
 * `JsonStringEnumMemberConverter` — nunca chega como número.
 */
function paraTipo(valor: PessoaApi['type']): Pessoa['tipo'] {
  return valor === 'MALE' ? 'masculino' : 'feminino'
}

export function paraDominio(dto: PessoaApi): Pessoa {
  const sobrenome = dto.lastName ?? null
  return {
    id: idOuFalha(dto.id),
    nome: dto.firstName,
    sobrenome,
    nomeCompleto: paraNomeCompleto(dto.firstName, sobrenome),
    // `dateBirth` chega sem offset no fio — `deApi` trata texto sem fuso
    // como horário de Brasília. Nunca `null` aqui: o campo é `DateTime` não
    // anulável no C#, sempre presente.
    nascimento: deApi(dto.dateBirth) as Date,
    tipo: paraTipo(dto.type),
    ativo: dto.active,
    idade: dto.age,
  }
}

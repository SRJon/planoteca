import type { Ordenacao } from './ordenacao'

/**
 * Traduz a ordenação da tabela (nome de campo do domínio, `entities/pessoa`)
 * para o parâmetro `sort` que a API espera: nome de propriedade C# do
 * `PersonSampleDto`, em PascalCase, com prefixo `-` para descendente
 * (`FilterDto.cs`: o getter de `sort` faz `_sort.IndexOf('-') == 0` e monta
 * `"<campo> desc"`; sem prefixo monta `"<campo> asc"`).
 *
 * O mapa cobre os campos por onde `pages/pessoas` ordena a tabela — não é
 * PascalCase mecânico do nome do domínio, porque o domínio está em
 * português (`entities/pessoa/modelo.ts`) e o DTO em inglês
 * (`PersonSampleDto`, `contracts/openapi-v1.json`): `nome`→`FirstName`,
 * `sobrenome`→`LastName`, `nascimento`→`DateBirth`, `idade`→`Age`,
 * `ativo`→`Active`. `id` não entra no mapa porque já é PascalCase igual
 * nos dois lados (`Id`).
 */
const MAPA_CAMPO_API: Record<string, string> = {
  id: 'Id',
  nome: 'FirstName',
  sobrenome: 'LastName',
  nascimento: 'DateBirth',
  idade: 'Age',
  ativo: 'Active',
}

/**
 * Ordenação usada quando ninguém escolheu nenhuma — mesmo valor com que o
 * `FilterDto` nasce no back-end (`this.sort = "Id"`, no construtor).
 *
 * Existe porque o getter de `sort` do `FilterDto` lança
 * `NullReferenceException` quando `_sort` é `null`
 * (`_sort.IndexOf('-')` sobre `null`): o parâmetro `sort` da querystring,
 * se vier ausente, faz o model binder do ASP.NET deixar a propriedade sem
 * `set`, e o valor do construtor sobrevive — mas só porque o construtor
 * roda antes do bind. Omitir o parâmetro é seguro; mandar `sort=` vazio
 * NÃO é (o binder chamaria o `set` com string vazia, e `''.IndexOf('-')`
 * é `-1`, então cai no ramo `asc` com campo vazio — erro silencioso, não
 * exceção, mas ainda quebrado). Por segurança este módulo nunca deixa o
 * chamador mandar `sort` vazio: `useFiltroPessoas` sempre inclui este
 * padrão quando não há ordenação escolhida.
 */
export const ORDENACAO_PADRAO_API = 'Id'

/**
 * Campo desconhecido (fora do mapa) não lança nem é descartado em
 * silêncio: a tradução PascalCase mecânica (primeira letra maiúscula) é o
 * mesmo padrão que os campos conhecidos seguem, então um campo novo
 * adicionado à tabela sem entrada no mapa ainda produz um `sort` plausível
 * em vez de travar a tela — o pior caso é a API devolver 400 por
 * propriedade inexistente, visível no `network`, não um crash de render.
 */
function paraCampoApi(campo: string): string {
  const traduzido = MAPA_CAMPO_API[campo]
  if (traduzido) return traduzido
  return campo.charAt(0).toUpperCase() + campo.slice(1)
}

export function paraSortApi(ordenacao: Ordenacao): string {
  const campo = paraCampoApi(ordenacao.campo)
  return ordenacao.direcao === 'desc' ? `-${campo}` : campo
}

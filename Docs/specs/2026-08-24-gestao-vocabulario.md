<!-- gerado de docs/specs/2026-08-24-gestao-vocabulario.html
     sha256 da fonte: cc1756f19d69a0ad
     em: 2026-08-24T17:05
     NAO ESCREVA NESTE ARQUIVO. Altere o HTML e regenere. -->

# Gestão de vocabulário no painel — contrato de máquina

## Objetivo

Abrir o cadastro de componente, série e metodologia ao administrador, por rota
protegida e tela própria. A rota pública da Biblioteca não se altera.

## Restrições globais

- O alvo são as pastas `planoteca-api` e `planoteca-web`. Nada fora delas se altera.
- `GET /api/v1/vocabulary` continua `AllowAnonymous` e continua devolvendo só os ativos.
- Escrita fica sob `[Authorize(Policy = "Administrador")]`. A policy já existe.
- Papel nunca vira custom claim do Firebase. Ele mora em `pessoa.papel`.
- Não existe exclusão física. Desativar é alterar o campo `Ativo` ou `Ativa`.
- Cor de componente sai de uma lista fechada de quatro tokens. O Tailwind só gera
  classe escrita literalmente no fonte.
- Cor literal em componente reprova no `npm run lint`. Use token.
- Escrita exige entidade rastreada. Não use `AsNoTracking` na busca por id.
- Fixture nova entra em `src/teste/servidor.ts` e em `e2e/simulacao.ts`, nos dois.
- Teste da API usa xUnit, NSubstitute e FluentAssertions.
- Teste do front usa Vitest, Testing Library e MSW.
- Commit segue Conventional Commits, com escopo pelo domínio.

## Requisitos funcionais

### RF-01 — A rota pública não se altera

`GET /api/v1/vocabulary` responde sem token e devolve só item ativo.

### RF-02 — A escrita recusa quem não é administrador

Toda rota sob `/api/v1/admin/vocabulary` responde `403` para quem não tem a claim
`papel` com valor de administrador.

### RF-03 — A leitura administrativa inclui o inativo

`GET /api/v1/admin/vocabulary` devolve item ativo e item inativo. A rota pública
não devolve o inativo.

### RF-04 — A cor é lista fechada

Criar ou alterar componente com cor fora dos quatro tokens recusa com `400`.

Os quatro tokens:

```
comp-linguagens
comp-matematica
comp-natureza
comp-humanas
```

### RF-05 — O nome não repete dentro do tipo

Criar item com nome que já existe no mesmo tipo recusa com `400`.

Alterar um item mantendo o próprio nome é aceito.

### RF-06 — Alterar persiste, e desativar retira do público

Alterar um item persiste o campo. Desativar retira o item de
`GET /api/v1/vocabulary` e o mantém em `GET /api/v1/admin/vocabulary`.

### RF-07 — A tela existe e é de administrador

`/admin/vocabulario` lista três abas: componentes, séries e metodologias. O item de
menu aparece só para administrador.

### RF-08 — A mutação invalida o cache

Cadastrar pela tela invalida `CHAVE_VOCABULARIO`. A lista atualiza sem recarregar
a página.

### RF-09 — A ordem é calculada, nunca recebida

O corpo de criação e de alteração NÃO traz `ordem`.

| Tipo | Onde o item novo entra |
|---|---|
| Série | no fim da própria etapa; as posteriores abrem espaço |
| Componente | no fim da própria área |

Alterar um item preserva a ordem que ele já tem.

`serie.ordem` é `UNIQUE` no banco. Com o campo no formulário, um número já em
uso faz o `INSERT` estourar com a exceção crua do EF Core.

### RF-10 — As frases da recusa

| Regra | Vale para | Frase |
|---|---|---|
| Nome obrigatório, até 80 caracteres | os três | `O nome é obrigatório.` |
| Nome não repete dentro do tipo | os três | `Já existe um item com este nome.` |
| Cor entre os quatro tokens | componente | `A cor precisa ser um token que o tema conhece.` |
| Sigla com duas letras | componente | `A sigla tem duas letras.` |
| Área obrigatória | componente | `A área é obrigatória.` |
| Etapa entre as duas conhecidas | série | `A etapa é fundamental ou médio.` |
| Tipo entre os três conhecidos | metodologia | `O tipo é metodologia, técnica ou ferramenta.` |

### RF-11 — As rotas de escrita

| Método e rota | Corpo | Resposta |
|---|---|---|
| `GET /api/v1/admin/vocabulary` | nenhum | `200` com as três listas |
| `POST /api/v1/admin/vocabulary/components` | componente | `201` com o criado |
| `PUT /api/v1/admin/vocabulary/components/{id}` | componente | `204` |
| `POST /api/v1/admin/vocabulary/grades` | série | `201` com o criado |
| `PUT /api/v1/admin/vocabulary/grades/{id}` | série | `204` |
| `POST /api/v1/admin/vocabulary/methodologies` | metodologia | `201` com o criado |
| `PUT /api/v1/admin/vocabulary/methodologies/{id}` | metodologia | `204` |

A recusa devolve `400` com o corpo de erro do projeto:

```json
{ "status": 400, "messages": ["A cor precisa ser um token que o tema conhece."] }
```

## Defeitos conhecidos do protótipo

Não há protótipo.

## Fontes

| Caminho | O que decide |
|---|---|
| `planoteca-api/src/SaraivaTech.Planoteca.Api/Controllers/AdminPessoasController.cs` | forma do controller administrativo: policy, rota, recusa por `Result` |
| `planoteca-api/src/SaraivaTech.Planoteca.Application.Core/Services/PessoaAdminAppService.cs` | como a validação vira `Result.Failure` e como a transação fecha |
| `planoteca-api/src/SaraivaTech.Planoteca.Api/Controllers/VocabularyController.cs` | a rota pública que não se altera |
| `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Componente.cs` | campos do componente e razão de cada obrigatoriedade |
| `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Serie.cs` | campos da série e a chave natural |
| `planoteca-api/src/SaraivaTech.Planoteca.Domain/Entities/Metodologia.cs` | campos da metodologia e o campo `Tipo` |
| `planoteca-api/src/SaraivaTech.Planoteca.Infra.Data/Repositories/VocabularioRepository.cs` | ordenação de cada lista e o uso de `AsNoTracking` |
| `planoteca-api/src/SaraivaTech.Planoteca.Application/Dto/VocabularioDto.cs` | o contrato de saída que a rota pública já entrega |
| `planoteca-api/src/SaraivaTech.Planoteca.Infra.CrossCutting/IoC/DependencyInjectionBootStrapper.cs` | onde registrar o serviço novo |
| `planoteca-api/tests/SaraivaTech.Planoteca.Test/Application/PostAppServiceTest.cs` | forma do teste de AppService com NSubstitute |
| `planoteca-web/src/entities/vocabulario/modelo.ts` | os quatro tokens de cor e por que o mapa é escrito |
| `planoteca-web/src/entities/vocabulario/api.ts` | o contrato de fio e o cliente por parâmetro |
| `planoteca-web/src/entities/vocabulario/useVocabulario.ts` | a chave de cache e o `staleTime` de uma hora |
| `planoteca-web/src/entities/conta/useContas.ts` | forma da mutação: `useMutation` com `invalidateQueries` |
| `planoteca-web/src/entities/conta/api.ts` | como a função de escrita chama `cliente.enviar` |
| `planoteca-web/src/shared/api/cliente.ts` | os métodos do cliente: `obter`, `listar`, `enviar`, `remover` |
| `planoteca-web/src/pages/admin/PaginaModeracao.tsx` | as abas por `Chip` e a forma do estado vazio |
| `planoteca-web/src/pages/admin/PaginaPessoasAdmin.test.tsx` | setup do teste de página com `QueryClientProvider` |
| `planoteca-web/src/app/shell/permissoes.ts` | o item de menu e o papel que o revela |
| `planoteca-web/src/app/rotas/Rotas.tsx` | onde a rota protegida entra |
| `planoteca-web/src/teste/servidor.ts` | handler MSW do teste de unidade |
| `planoteca-web/e2e/simulacao.ts` | handler da simulação do Playwright |
| `CLAUDE.md` | decisões que não se renegociam e o portão antes de fechar |

## Critérios de aceite

- `cd planoteca-api && dotnet build` sai com código 0.
- `cd planoteca-api && dotnet test` sai com código 0.
- `cd planoteca-web && npm run lint` sai com código 0.
- `cd planoteca-web && npm run test` sai com código 0.
- `cd planoteca-web && npm run build` sai com código 0.
- `cd planoteca-web && npm run e2e` sai com código 0.
- Um teste exercita `GET /api/v1/vocabulary` sem token e recebe só ativos.
- Um teste exercita cor inválida e recebe `Result.Failure` com a frase de RF-10.
- Um teste exercita nome repetido e recebe `Result.Failure`.
- Um teste da tela confirma as três abas e o estado vazio de cada uma.

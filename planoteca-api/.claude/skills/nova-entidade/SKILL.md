---
name: nova-entidade
description: Orquestra a criação completa de uma nova entidade fim-a-fim, camada por camada, na ordem correta (Domain → Domain.Core → Application → Application.Core → Infra.Data → Infra.CrossCutting → Api → Tests). Use quando o usuário pedir uma feature/entidade nova do zero.
---

# /nova-entidade

Cria uma entidade de negócio completa, do domínio ao endpoint HTTP, seguindo a arquitetura Clean Architecture deste boilerplate (`Api → Application → Domain → Infra.Data → SQL Server`). Cada camada tem sua própria skill com o template exato — esta skill só define a ordem e os pontos de decisão.

## Entidade a criar

$ARGUMENTS

---

## Antes de começar

Se não estiver claro pelo pedido do usuário, confirme rapidamente:
1. Nome da entidade e seus campos (com tipos)
2. Precisa de enum(s) próprio(s)?
3. Precisa de consulta paginada/filtrada customizada (Dapper) além do CRUD padrão, ou o CRUD genérico basta?
4. Precisa ser exposta como ferramenta MCP (`McpTools`) para agentes de IA, além do endpoint REST?
5. O caso de uso consome alguma API externa via HTTP (ERP, Sankhya, gateway de pagamento)? Se sim, isso é um Gateway — ver passo opcional abaixo.

Não pare para perguntar o óbvio — só pergunte o que não dá pra inferir do pedido.

## Ordem de execução

Siga estritamente essa ordem — cada camada depende da anterior:

1. **`camada-domain`** — Entity, `IXxxRepository`, `IXxxService`, enums, mensagens de validação
2. **`camada-domain-core`** — `Validator` (com `RuleSet` por operação) e `Service<TEntity>` concreto
3. **`camada-application`** — DTO (record), mapper Mapperly, `IXxxAppService` (Insert/Update/Delete retornando `Result<T>`/`Result`)
4. **`camada-application-core`** — `XxxAppService` concreto (transação via `UoW`, tradução de exceção de domínio para `Result<T>`)
5. **`camada-infra-data`** — `IEntityTypeConfiguration`, repositório concreto, migration
6. **`camada-infra-crosscutting`** — as 4 linhas de registro no `DependencyInjectionBootStrapper`
7. **`camada-api`** — Controller REST (e `McpTools` opcional, se decidido acima)
8. **`camada-tests`** — testes de Service, Validator e AppService

**Passo opcional — `camada-gateways`**: se o caso de uso chama uma API externa, crie o Gateway **antes do passo 4** (`camada-application-core`), porque o AppService vai injetar `IXxxGateway`. O registro no DI entra junto com o passo 6.

## Checklist final (equivalente ao "Adding a new entity" do CLAUDE.md)

- [ ] `dotnet build` sem erros
- [ ] Migration criada e aplicada (`dotnet ef database update`)
- [ ] `dotnet test` passando
- [ ] API sobe (`dotnet run --project src/SaraivaTech.Planoteca.Api`) e o endpoint aparece no Scalar (`/scalar/v1`)
- [ ] Testado manualmente pelo menos um `POST` e um `GET` via Scalar ou curl

## Notas de consistência entre camadas

- **`Result<T>` só na fronteira do AppService** (Application/Application.Core) — nunca mude as assinaturas genéricas `IService<T>`/`IRepository<T>` do Domain. Domain.Core continua lançando `FluentValidation.ValidationException` para violações de regra; o AppService converte isso em `Result<T>.Failure(...)`.
- **Validators sempre com `RuleSet` nomeado** (`Insert`/`Update`/`Delete`) — sem isso, o `Service<TEntity>` base não valida nada (`IncludeRuleSets` só roda regras dentro do ruleset indicado).
- **DI é mecânico, mas obrigatório** — a falta de uma das 4 linhas em `DependencyInjectionBootStrapper` só quebra em runtime, não em compile-time.

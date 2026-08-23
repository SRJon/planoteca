# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estrutura de pastas

```
src/       → projetos de código-fonte (Api, Application, Domain, Infra)
tests/     → projetos de teste
docs/      → documentação
```

## Commands

```powershell
# Criar novo projeto a partir do boilerplate
.\New-Project.ps1 -Company Acme -Project Financeiro -OutputPath C:\Projetos\Acme.Financeiro
```

```bash
# Build
dotnet build
dotnet build -c Release

# Run API (launches at https://localhost:7206)
dotnet run --project src/SaraivaTech.Planoteca.Api

# Run all tests
dotnet test

# Run a specific test by name filter
dotnet test --filter "FullyQualifiedName~Criptografia"

# EF Core migrations (run from solution root)
dotnet ef migrations add <Name> --project src/SaraivaTech.Planoteca.Infra.Data --startup-project src/SaraivaTech.Planoteca.Api
dotnet ef database update --project src/SaraivaTech.Planoteca.Infra.Data --startup-project src/SaraivaTech.Planoteca.Api

# Docker (PostgreSQL + API)
docker-compose up -d
```

API docs (when running): `https://localhost:7206/scalar/v1`

## Architecture

Clean Architecture with 7 projects:

```
Api → Application → Domain → Infra.Data → PostgreSQL
            ↓            ↓
    Application.Core  Domain.Core
```

- **Api**: Controllers, middleware (`InterceptorHandlingMiddleware`), JSON/DateTime/GUID converters, Scalar/OpenAPI, JWT auth, versioning, CORS, compression, servidor MCP (`McpTools/`, mapeado em `/mcp`). All service registrations live in `ServiceExtensions.cs`, exceto o MCP e o pipeline, que ficam em `Program.cs`.
- **Application**: DTOs, interfaces de app service, mappers do **Riok.Mapperly** em `Mappers/`, classe base abstrata `AppService` (que expõe apenas `IUnitOfWork`). O mapper concreto é injetado no app service que precisa dele, não na classe base.
- **Application.Core**: Implementações concretas dos app services. Contém também `Helpers/CriptografiaHelper` (AES CBC/PKCS7 com base64 URL-safe).
- **Domain**: Entities, interfaces de repositório e serviço, enums, mensagens de validação, `Base/Interfaces/` (`IRepository<T>`, `IService<T>`, `IUnitOfWork`, `IFilterParameters`). Contém `Base/Result.cs` com o padrão Result (`Result`, `Result<T>`, `ResultError`).
- **Domain.Core**: Classe base `Service<TEntity>` (FluentValidation com RuleSets Insert/Update/Delete), validadores (`AbstractValidator<T>`) e implementações concretas dos domain services.
- **Infra.Data**: EF Core `DatabaseContext`, repository implementations, `UnitOfWork`, Dapper for complex queries, Fluent API entity mappings. **Não há pasta `Migrations/` no repositório** — o boilerplate não versiona nenhuma migration; um projeto novo precisa rodar `dotnet ef migrations add Initial` antes do primeiro `database update`. O `Repository<T>` base **não chama `SaveChanges()`** — apenas marca mudanças no contexto EF. A persistência ocorre em `UoW.Commit()`, que chama `SaveChanges()` antes de commitar a transação.
- **Infra.CrossCutting**: `DependencyInjectionBootStrapper` wires all layers, Serilog setup, OpenTelemetry config.

### ⚠️ Estado real da autenticação — leia antes de mexer

Duas lacunas que aparentam estar resolvidas e não estão. Não assuma nenhuma das duas ao planejar uma tarefa:

1. **Não existe endpoint de autenticação neste projeto.** `POST /api/v1/auth/login` e `GET /api/v1/auth/userinfo` **não existem** — o front `planoteca-web` os consome e documenta a mesma lacuna do lado dele. A API só **valida** JWT emitido por um provedor externo (`JwtAuth:Authority`/`JwtAuth:Audience`); ela não emite token. Existem DTOs em `Application/Dto/Authorization/` (`TokenDto`, `UserInfoDto`, `ProfileDto`), mas nenhum código os usa — são contratos órfãos. Se a tarefa pedir login, isso é implementação nova, não ligação de fio existente.
2. **Não há nenhum controller.** A fatia de exemplo `PersonSample` foi removida na migração para PostgreSQL — era andaime de boilerplate, e o SQL Dapper dela era T-SQL puro. `UseAuthentication()`/`UseAuthorization()` rodam no pipeline, mas não há rota a proteger ainda, inclusive `/mcp`. **A primeira entidade real da Planoteca é `Plano`**, e o front já espera `GET /api/v1/lesson-plans` (ver `planoteca-web/contracts/openapi-v1.json`).

   Quando ela nascer: a Biblioteca é **pública por decisão de produto**. O endpoint de listagem e o de download de plano **não podem** exigir token — ver o `CLAUDE.md` da raiz.

Correlato: `Api/Policies/` contém `CustomAuthenticationHandler`, `AuthorizeAppHandler` e `AuthorizeAppRequirement`. **Nada disso é registrado** em `Program.cs` nem em `ServiceExtensions.cs` — é código morto herdado. Alterar esses arquivos não muda o comportamento de nenhuma requisição.

### Servidor MCP

`Program.cs` registra `AddMcpServer().WithHttpTransport(stateless).WithToolsFromAssembly()` e mapeia `app.MapMcp("/mcp")` (pacote `ModelContextProtocol.AspNetCore`). Ferramentas ficam em `Api/McpTools/`: classe com `[McpServerToolType]`, métodos com `[McpServerTool]`. `WithToolsFromAssembly()` descobre tudo por reflexão — não há registro manual.

Uma ferramenta MCP injeta o MESMO app service do controller: ela **nunca** reimplementa regra de negócio. `[Description]` em cada método e parâmetro é obrigatório — é o único contexto que o agente cliente recebe. Marque `[McpServerTool(ReadOnly = true)]` quando a ferramenta não escreve.

### PostgreSQL — o que muda em relação ao boilerplate

O banco é PostgreSQL 16 (`Npgsql.EntityFrameworkCore.PostgreSQL`), migrado do SQL Server seguindo o projeto irmão Farol (`DEV/Farol/csc-farol-api-dotnet`).

- **snake_case.** `EFCore.NamingConventions` + `.UseSnakeCaseNamingConvention()`. Tabela `plano`, coluna `arquivo_url`. Não escreva `HasColumnName` só para converter caixa — a convenção já faz isso.
- **A wiring é duplicada, de propósito, em dois arquivos.** `Infra.CrossCutting/IoC/DependencyInjectionBootStrapper.cs` (runtime) e `Infra.Data/Context/DatabaseContextFactory.cs` (design-time). Mudou provider ou convenção num, mude no outro — divergir faz `dotnet ef migrations` gerar um modelo que não é o que roda.
- **Dapper precisa de `DefaultTypeMap.MatchNamesWithUnderscores = true`** (já em `Program.cs`). Sem isso ele não liga `arquivo_url` a `ArquivoUrl` e devolve a propriedade **nula, sem erro nenhum**.
- **SQL cru é Postgres, não portável.** Nada de colchetes `[coluna]` — em Postgres a citação é aspas dupla, e ela torna o identificador *case-sensitive*. Use `LIMIT`/`OFFSET`, `ILIKE`, `COALESCE`, `count(*) OVER()::int`. Em `RETURNING`, dê alias entre aspas duplas (`id AS "Id"`) para o Dapper mapear.
- **`DateTime` tem que ser UTC.** O Npgsql 6+ recusa `DateTime` com `Kind != Utc` numa coluna `timestamptz`, em tempo de execução. Sempre `DateTime.UtcNow` na escrita, e normalize o que vier de fora (JSON, query string). **Não** ligue `Npgsql.EnableLegacyTimestampBehavior` — o Farol optou por respeitar o comportamento estrito, e nós também.
- **Tipos**: `text` para texto livre, `varchar(n)` quando o limite é regra de negócio, `timestamp with time zone` para data, `jsonb` para documento, `uuid` para `Id` (o provider deriva de `Guid`). `HasDefaultValueSql("now()")` no lugar de `GETDATE()`.
- **Índice parcial, GIN e coluna gerada o EF não gera** — escreva com `migrationBuilder.Sql()` dentro da migration.

### Key conventions

- All NuGet versions are centralized in `Directory.Packages.props` — edit versions there, not in `.csproj` files.
- `appsettings.Local.json` is gitignored; use it for local overrides. Formato da connection string de dev: `Host=localhost;Port=5432;Database=planoteca;Username=postgres;Password={SUA_SENHA}`. A senha real nunca vai versionada — coloque em `appsettings.Local.json` (gitignored) ou em `user-secrets`.
- JWT: `RegisterAuthentication` lê `JwtAuth:Authority` e `JwtAuth:Audience` da configuração. Os placeholders ficam em `appsettings.json`; os valores reais vão em `user-secrets` ou variável de ambiente. Não há vínculo com nenhum provedor específico — serve qualquer emissor OIDC.
- Error responses use a standardized `Error` model (HTTP status + message list) via `StandardErrorResultFilter`.
- Entity `Id` é `Guid` (gerado no construtor de `Entity`). Projetos com banco legado (int) devem sobrescrever localmente — não alterar o boilerplate.
- `docker-compose.yml` sobe PostgreSQL 16 + API na porta 5000. Banco: `planoteca`. Credenciais vêm do `.env` (gitignored, template em `.env.template`) — o compose **falha** se `POSTGRES_PASSWORD` não estiver definida, de propósito: senha de banco não fica versionada.
- Use o padrão `Result`/`Result<T>` (`Domain/Base/Result.cs`) para retornos de operações que podem falhar, em vez de lançar exceções.
- O `Repository<T>` expõe `protected DatabaseContext Context` (cast tipado de `Uow.Context`) — use sempre `Context` em vez de `Uow.Context` nos repositórios concretos.
- Em blocos `catch` dentro de AppServices, sempre use `throw` (preserva stack trace), nunca `throw ex`.

### Adding a new entity

1. Entity in `Domain/Entities/`, repository interface in `Domain/Repositories/Interfaces/`
2. DTO in `Application/Dto/`, mapper `[Mapper] partial class` do Mapperly in `Application/Mappers/`
3. Domain service interface + implementation, app service interface + implementation
4. Repository implementation in `Infra.Data/Repositories/`
5. Register all in `DependencyInjectionBootStrapper`: `RegisterRepositories()`, `RegisterServices()`, `RegisterAppServices()` e `RegisterMappers()`
6. Controller inheriting `ControllerBase` with `[ApiVersion]` attribute
7. `dotnet ef migrations add` and `database update`
8. Se a entidade deve ser consultável por agentes, exponha também uma ferramenta MCP em `Api/McpTools/`

### Test stack

xUnit + NSubstitute (mocks) + AutoFixture/Bogus (test data) + FluentAssertions. Coverage via Coverlet.

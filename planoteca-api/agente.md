# Contexto do Projeto: SaraivaTech.Planoteca.Api

> **Este arquivo foi reduzido a um ponteiro.** A documentação de arquitetura, comandos e convenções do projeto vive em [`CLAUDE.md`](./CLAUDE.md), que é mantido junto com o código. Manter as duas fontes em paralelo produziu divergência: até esta revisão, este arquivo afirmava `.NET 9` (o real é `net10.0`), AutoMapper (o real é Riok.Mapperly), Auth0 com `Auth0:Domain`/`Auth0:Audience` (o real é `JwtAuth:Authority`/`JwtAuth:Audience`, sem vínculo com nenhum provedor) e `NativeInjectorBootStrapper` (o nome real é `DependencyInjectionBootStrapper`).

## Para agentes de IA

Leia **[`CLAUDE.md`](./CLAUDE.md)** antes de qualquer tarefa neste repositório. Ele cobre:

- Comandos de build, teste, execução e migrations
- As 7 camadas da Clean Architecture e o que pertence a cada uma
- Convenções de código (padrão `Result`, `Repository<T>` sem `SaveChanges`, `throw` em vez de `throw ex`)
- Passo a passo para adicionar uma entidade nova
- O servidor MCP em `/mcp` e como criar ferramentas
- **As lacunas reais de autenticação** — não existe endpoint de login, e `[Authorize]` está comentado

As skills em `.claude/skills/` dão o passo a passo por camada: `camada-api`, `camada-application`, `camada-application-core`, `camada-domain`, `camada-domain-core`, `camada-infra-data`, `camada-infra-crosscutting`, `camada-gateways`, `camada-tests` e `nova-entidade`.

> A skill `camada-gateways` descreve um padrão de integração HTTP (contrato em `Domain/Gateways/`, implementação em `Infra.Data/Gateways/`, `HttpClient` tipado). **Essas pastas ainda não existem no repositório** e não há `RegisterGateways` no `DependencyInjectionBootStrapper` — a skill é o gabarito a seguir quando o primeiro gateway for criado, não a descrição de código existente.

## Organização de arquivos e logs

- **Logs de build e temporários**: ao gerar log de build, debug ou qualquer arquivo temporário, grave em `logs/` na raiz do projeto.
- A pasta `logs/` já está no `.gitignore`, então esses arquivos não são versionados.

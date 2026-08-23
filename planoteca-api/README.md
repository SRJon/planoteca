# .NET Boilerplate API

> Este projeto é a metade **back-end** do boilerplate. O par front-end é o `saraivatech-web`, e os dois vivem no mesmo repositório (`SRJon/boilerplate`), lado a lado na raiz. A raiz do monorepo tem seu próprio `README.md` com a visão dos dois juntos; este arquivo cobre apenas a API.

Este projeto é um *boilerplate* (modelo base) para o desenvolvimento de APIs em **.NET 10**. Ele fornece uma arquitetura padronizada em camadas, já configurada, projetada para acelerar o início de novos projetos e garantir consistência técnica entre microsserviços.

Os projetos da solução usam o namespace `SaraivaTech.Planoteca.*`. O script `New-Project.ps1` renomeia esse prefixo para o nome que você escolher ao gerar um projeto novo — veja [Como Criar um Novo Projeto](#️-como-criar-um-novo-projeto).

## 🚀 Principais Features e Tecnologias

A arquitetura do projeto promove separação de responsabilidades (Clean Architecture / Onion Architecture) e já vem pré-configurada com as seguintes tecnologias:

- **.NET 10**: Framework central moderno e performático.
- **OpenAPI e Scalar**: Documentação interativa das definições de API (via `/openapi/v1.json`). O Scalar foi adotado para prover uma UI de documentação mais leve e fluída, em sintonia com os novos padrões do ASP.NET.
- **Servidor MCP**: A API também se expõe como servidor *Model Context Protocol* em `/mcp`, o que permite a um agente de IA consultar os dados por ferramentas tipadas. Veja [Servidor MCP](#-servidor-mcp).
- **Autenticação e Autorização**: Validação de JWT (Bearer tokens) emitidos por um provedor de identidade externo. O boilerplate **valida** o token, mas **não emite** nenhum — não há endpoint de login. Veja [Lacunas conhecidas](#-lacunas-conhecidas).
- **Entity Framework Core**: ORM mapeado por padrão para uso de bancos relacionais **SQL Server**.
- **Riok.Mapperly**: Para mapeamento entre os DTOs da camada de aplicação e as Entidades da camada de Domínio. É um *source generator*: o código de mapeamento nasce em tempo de compilação, sem reflexão e sem custo de inicialização.
- **Injeção de Dependência Transversal**: Configurações robustas como:
  - Políticas de resiliência usando Polly.
  - Otimização de compactação de resposta com Brotli/Gzip.
  - Observabilidade e tracing utilizando OpenTelemetry.
  - Versionamento de API out-of-the-box (`Asp.Versioning.Mvc`).

## 📁 Estrutura do Projeto

A solução acompanha a separação tática em camadas claras:

1. **SaraivaTech.Planoteca.Api**: Camada de entrada/apresentação (Controllers, Middlewares e inicialização do contêiner `Program.cs`).
2. **SaraivaTech.Planoteca.Application**: Orquestração da aplicação, serviços focados nos `use-cases` e definição formal de `DTOs`.
3. **SaraivaTech.Planoteca.Domain**: Núcleo isolado do negócio hospedando as Entidades e Regras de Negócio fundamentais.
4. **SaraivaTech.Planoteca.Infra.Data**: Acesso aos dados, `DatabaseContext`, *Mappings* Fluent-API e injeções de repositórios dinâmicos via Entity Framework.
5. **SaraivaTech.Planoteca.Infra.CrossCutting**: Módulos globais e transversais (IoC, Logs com Serilog, Interceptadores de erro).
6. **SaraivaTech.Planoteca.Test**: Pacote inicial com bibliotecas preparadas para testes unitários.

## 📋 Pré-Requisitos (Ambiente Dev)

Para baixar e utilizar o boilerplate você precisará, no mínimo:
- [SDK do .NET 10](https://dotnet.microsoft.com/download/dotnet/10.0) ou superior.
- Database Engine do SQL Server suportado (local, Docker ou cloud).
- Ambiente compatível com Visual Studio 2022 (última build), JetBrains Rider ou VS Code.

## 🛠️ Como Criar um Novo Projeto

Use o script `New-Project.ps1` na raiz deste repositório para gerar um projeto novo com todos os namespaces, nomes de arquivo e banco de dados já renomeados:

```powershell
.\New-Project.ps1 -Company Acme -Project Financeiro -OutputPath C:\Projetos\Acme.Financeiro
```

O script:
- Copia o boilerplate para `OutputPath`
- Substitui `SaraivaTech.Planoteca` → `Acme.Financeiro` em todos os arquivos e pastas
- Substitui `SaraivaTechPlanotecaDb` → `AcmeFinanceiroDb` nas connection strings
- Remove `.git`, `bin`, `obj`, `appsettings.Local.json` e o próprio script do destino

Após executar o script:

1. Abra `Acme.Financeiro.sln` no seu IDE
2. Crie `src\Acme.Financeiro.Api\appsettings.Local.json` com sua connection string local
3. Gere a primeira migration e aplique no banco. **O boilerplate não traz nenhuma migration versionada** — não existe pasta `Migrations/` no repositório, então o primeiro comando abaixo é obrigatório antes do `database update`:
   ```bash
   dotnet ef migrations add Initial --project src\Acme.Financeiro.Infra.Data --startup-project src\Acme.Financeiro.Api
   dotnet ef database update --project src\Acme.Financeiro.Infra.Data --startup-project src\Acme.Financeiro.Api
   ```
4. Inicie a API:
   ```bash
   dotnet run --project src\Acme.Financeiro.Api
   ```

A API estará acessível na porta configurada (ex: `https://localhost:7206`).
Para testar os endpoints e a configuração de autorização, navegue para:
👉 `https://localhost:7206/scalar/v1`

## 🧩 Servidor MCP

Além da API REST, o projeto sobe um servidor **MCP (Model Context Protocol)** no endpoint `/mcp`, registrado em `Program.cs` via `AddMcpServer()` e `app.MapMcp("/mcp")` (pacote `ModelContextProtocol.AspNetCore`). O transporte é HTTP em modo *stateless*.

As ferramentas expostas ficam em `src/SaraivaTech.Planoteca.Api/McpTools/`. Uma classe vira servidor de ferramentas com o atributo `[McpServerToolType]`; cada método público marcado com `[McpServerTool]` vira uma ferramenta. O registro é automático: `WithToolsFromAssembly()` varre o assembly, então basta criar a classe.

O exemplo `PersonSampleMcpTools` publica três ferramentas de leitura (`GetPersonSampleById`, `GetPersonSamples`, `GetAllPersonSamples`), que injetam o mesmo `IPersonSampleAppService` usado pelos controllers — a regra de negócio não é duplicada. Use `[Description]` em cada método e parâmetro: esse texto é o que o agente lê para decidir como chamar a ferramenta.

Para conectar um cliente MCP (Claude Code, por exemplo) à API rodando local:

```bash
claude mcp add --transport http saraivatech-api https://localhost:7206/mcp
```

> O endpoint `/mcp` herda o pipeline da API, incluindo autenticação. Como hoje nada exige `[Authorize]` (veja abaixo), ele está anônimo — não exponha essa porta fora da máquina de desenvolvimento sem antes fechar a autorização.

## ⚠️ Lacunas conhecidas

O boilerplate é um ponto de partida, e há peças que cada projeto precisa fechar. Elas estão listadas aqui para não serem descobertas em produção:

- **Não existe endpoint de autenticação.** O único controller do projeto é o `PersonSampleController`. Não há `POST /api/v1/auth/login` nem `GET /api/v1/auth/userinfo` — endpoints que o front `saraivatech-web` espera consumir. A API apenas valida um JWT emitido por um provedor externo (`JwtAuth:Authority` / `JwtAuth:Audience`). Quem precisa de login próprio precisa implementar o controller e a emissão de token.
- **Os endpoints estão anônimos.** O atributo `[Authorize]` do `PersonSampleController` está comentado no código. A autenticação está configurada no pipeline, mas nenhuma rota a exige. Descomente antes de subir qualquer ambiente exposto.
- **Nenhuma migration versionada.** Veja o passo 3 de [Como Criar um Novo Projeto](#️-como-criar-um-novo-projeto).
- **Código de autorização inativo.** A pasta `src/SaraivaTech.Planoteca.Api/Policies/` contém `CustomAuthenticationHandler`, `AuthorizeAppHandler` e `AuthorizeAppRequirement`. Nada disso é registrado em `Program.cs` ou `ServiceExtensions.cs` — é código morto herdado, mantido como referência. Não assuma que está no caminho da requisição.

## 🤝 Evoluindo o Boilerplate

As melhorias feitas aqui se propagam para todo projeto gerado a partir do boilerplate. Ao encontrar avisos em pacotes instalados `(e.g., Riok.Mapperly)`, oportunidades de atualização de compiladores, ou caso desenhe uma configuração melhor, abra um *Pull Request* e reforce o projeto *core*.

## ⚙️ Análise de Código (opcional)

O hook de `pre-push` do [lefthook](https://lefthook.dev) roda uma análise SonarQube quando as variáveis `SONAR_HOST_URL`, `SONAR_PROJECT_KEY` e `SONAR_TOKEN` estão definidas no ambiente. Sem elas o passo é pulado e o push segue normalmente.
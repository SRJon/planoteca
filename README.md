# Planoteca

Acervo público de planos de aula com metodologias ativas, para professores da educação básica brasileira.

## O problema

Metodologia ativa é assunto batido em formação continuada. Na hora de dar aula, o professor não tem material pronto. Ele tem uma hora vaga, uma turma amanhã, e nenhum tempo para desenhar uma sequência didática do zero.

A Planoteca entrega o plano pronto, catalogado por série, componente e metodologia, em PDF, na hora.

O nome é a proposta: **plano + teca**. Um acervo, um catálogo, uma coleção organizada — não um feed, não uma plataforma.

## Quem usa

Professor de ensino fundamental e médio, rede pública e privada. Intimidade com tecnologia muito variável. Chega pelo celular, com pressa, sabendo o que quer.

**Baixar não exige conta.** É decisão de produto, não detalhe de implementação. Qualquer barreira entre o professor e o PDF derruba o uso: login serve para escrever, não para consumir.

## Áreas do produto

Navegação superior: **Início · Biblioteca · Blog**, mais o botão de entrar.

### Início

Landing page. Explica o que é a Planoteca e joga o professor para a Biblioteca o mais rápido possível. O caminho para o acervo é o elemento mais forte da página.

### Biblioteca

O coração do produto. Listagem de planos com filtros por série, componente curricular, metodologia ativa, duração e código BNCC, mais busca por texto.

Cada plano tem página própria: objetivos de aprendizagem, materiais necessários, códigos BNCC e botão de download. Sem login, sem cadastro, sem espera.

### Blog

Área editorial e colaborativa. Textos, relatos de sala de aula e dicas escritos pelos próprios professores.

Qualquer professor cadastrado escreve. O texto entra como pendente e vai ao ar só depois da aprovação de um administrador. Moderação simples: publicar, devolver com comentário, ou recusar.

## Contas e permissões

Login exclusivamente com conta Google — não há sistema de senha a construir nem a guardar.

| Papel | Pode |
|---|---|
| **Visitante** (sem conta) | Navegar, filtrar, buscar, baixar qualquer plano |
| **Professor** | Tudo do visitante, mais escrever textos do blog e acompanhar o status do que enviou |
| **Administrador** | Tudo do professor, mais aprovar e devolver textos, publicar no blog, e fazer upload e catalogação de planos |

## Painel administrativo

Mesa de trabalho, não painel de métricas. Mostra primeiro o que precisa de atenção: textos aguardando aprovação.

Depois vêm a moderação do blog, a gestão dos planos publicados, e o formulário de envio. Esse formulário é o upload do PDF mais os campos de catalogação.

Esse formulário será preenchido dezenas de vezes seguidas na fase de povoamento do acervo. É otimizado para repetição, não para a primeira vez.

---

# Especificação técnica

## Estrutura do repositório

```
Planoteca/
├── planoteca-api/     back-end .NET 10, Clean Architecture
├── planoteca-web/     front-end React 19 + Vite
├── design/            sistema visual: tokens, direções, telas aprovadas
└── Docs/              todo.md e lessons.md
```

## Front-end — `planoteca-web`

| Item | Escolha |
|---|---|
| Runtime | Node >= 22 |
| Biblioteca de UI | React 19 |
| Build | Vite 6 |
| Linguagem | TypeScript 5.7 |
| Rotas | React Router 7 |
| Estado de servidor | TanStack Query 5 |
| Formulários | React Hook Form + Zod 4 |
| Estilo | Tailwind CSS 4 (plugin Vite), shadcn sobre Radix |
| Ícones | Phosphor, import por caminho direto |
| Tabelas | TanStack Table 8 |
| Testes de unidade | Vitest 4 + Testing Library + jsdom |
| Testes ponta a ponta | Playwright |
| Simulação de rede | MSW 2 |
| Contrato de API | `openapi-typescript` sobre `contracts/openapi-v1.json` |

### Arquitetura de pastas (Feature-Sliced)

```
src/
├── app/          providers, rotas, cascas (LayoutPublico e Shell), estilos
├── pages/        uma pasta por tela (inicio, biblioteca, blog, entrar, ...)
├── features/     casos de uso (autenticar, filtrar-planos, ...)
├── entities/     domínio (plano, pessoa, sessao) — modelo, api, mapeador, hook
├── components/   ui/ (shadcn) e marca/
├── shared/       cliente HTTP, config, lib
└── teste/        servidor MSW e utilitários de teste
```

A fronteira entre camadas é imposta pelo `eslint-plugin-boundaries`, não por convenção. `pages/` não importa `app/`.

Cada entidade segue o mesmo desenho. `modelo.ts` tem o domínio em português. `mapeador.ts` é a única peça que conhece o formato do DTO da API. `api.ts` faz a chamada, e `useX.ts` expõe o hook.

Nome de campo do fio não vaza para a tela.

### Duas cascas, e a linha entre elas

| Casca | Rotas | Guarda |
|---|---|---|
| `LayoutPublico` | `/` (landing), `/biblioteca`, `/blog` | nenhuma |
| `Shell` | `/pessoas` e o futuro painel administrativo | `RotaProtegida` |

O acervo é público: navegar, filtrar e baixar não passam por guarda nenhuma.

Login leva para a área de trabalho, não para a Biblioteca. Quem se identifica na
Planoteca é quem vai escrever ou catalogar.

Dois testes travam a regra: `src/app/rotas/guarda.test.tsx`, no bloco "o acervo é
público", e `e2e/biblioteca.spec.ts`, que filtra e pagina sem login.

### Domínio de plano

Tipos fechados, não `string` livre — o TypeScript recusa em tempo de escrita um valor que o tema não sabe pintar:

- **Componentes** (8): Português, Matemática, Ciências, História, Geografia, Arte, Ed. Física, Inglês. Cada um com cor e sigla de duas letras fixas.
- **Anos** (5): 6º, 7º, 8º, 9º, 1ª EM.
- **Plano**: `id`, `titulo`, `componente`, `ano`, `bncc`, `metodologia`, `duracao`, `arquivoUrl`.

O código BNCC é obrigatório, porque a busca por código é o caminho principal de quem chega ao acervo.

### Scripts

```bash
npm run dev          # servidor de desenvolvimento
npm run build        # typecheck dos 3 tsconfig + build Vite
npm run lint         # eslint --max-warnings 0 + verifica-tokens
npm run test         # vitest run
npm run e2e          # playwright
npm run api:sync     # regenera tipos do contrato OpenAPI
npm run api:check    # falha se os tipos divergirem do contrato
```

### Guarda de tokens

`scripts/verifica-tokens.mjs` roda dentro do `lint` e recusa, em arquivo de componente:

- cor literal (`#0163a2`, `rgb()`, `hsl()`)
- classe crua da paleta Tailwind (`bg-slate-950`, `text-zinc-400`)
- primitiva usada como nome semântico (`bg-red-500`)

Passa o que aponta para o tema: `bg-background`, `text-primary`, `border-border`. A cor mora em `src/app/estilos/tema.css` e em nenhum outro lugar.

## Back-end — `planoteca-api`

| Item | Escolha |
|---|---|
| Framework | .NET 10 |
| Banco | PostgreSQL 16 |
| ORM | EF Core 10 (`Npgsql`), mais Dapper para consulta complexa |
| Convenção de nomes | `EFCore.NamingConventions` — snake_case no banco |
| Mapeamento | Riok.Mapperly (source generator, sem reflexão) |
| Validação | FluentValidation 12, RuleSets Insert/Update/Delete |
| Documentação | OpenAPI e Scalar em `/scalar/v1` |
| Autenticação | JWT Bearer de provedor externo (valida, não emite) |
| Versionamento | `Asp.Versioning.Mvc` |
| Resiliência | Polly |
| Log | Serilog |
| Observabilidade | OpenTelemetry (ASP.NET Core, HTTP, OTLP) |
| MCP | `ModelContextProtocol.AspNetCore`, servidor em `/mcp` |
| Testes | xUnit, NSubstitute, AutoFixture, Bogus, FluentAssertions |

Versões de pacote são centralizadas em `Directory.Packages.props`. Não edite versão em `.csproj`.

### Camadas

```
Api → Application → Domain → Infra.Data → PostgreSQL
          ↓            ↓
  Application.Core  Domain.Core
```

- **Api** — controllers, middleware, conversores JSON/DateTime/GUID, Scalar, JWT, versionamento, CORS, compressão, ferramentas MCP.
- **Application** — DTOs, interfaces de app service, mappers Mapperly.
- **Application.Core** — implementação dos app services.
- **Domain** — entidades, interfaces de repositório e serviço, enums, padrão `Result`.
- **Domain.Core** — `Service<TEntity>` base e validadores.
- **Infra.Data** — `DatabaseContext`, repositórios, `UnitOfWork`, mapeamentos Fluent API.
- **Infra.CrossCutting** — IoC, Serilog, OpenTelemetry, middleware de erro.

O `Repository<T>` base não chama `SaveChanges()`. A persistência acontece em `UoW.Commit()`.

### Servidor MCP

A API se expõe como servidor Model Context Protocol em `/mcp`. Ferramentas ficam em `Api/McpTools/`, descobertas por reflexão (`WithToolsFromAssembly()`). Uma ferramenta MCP nunca reimplementa regra de negócio — ela injeta o mesmo app service do controller.

### Comandos

```bash
dotnet build
dotnet run --project src/SaraivaTech.Planoteca.Api      # https://localhost:7206
dotnet test
dotnet ef migrations add Inicial --project src/SaraivaTech.Planoteca.Infra.Data --startup-project src/SaraivaTech.Planoteca.Api
docker-compose up -d                                    # PostgreSQL e API
```

## Hospedagem

Tudo em plano gratuito. A restrição é deliberada, e governa as escolhas técnicas.

| Camada | Serviço |
|---|---|
| Front-end | Vercel |
| Back-end | Render |
| Banco | Neon (PostgreSQL serverless) |
| Arquivos | Cloudflare R2 |

Três consequências que aparecem no código:

- O PDF mora no R2, não no disco da API. O Render tem sistema de arquivos efêmero.
- O upload usa URL pré-assinada: o arquivo vai do navegador direto para o R2.
- API e banco hibernam quando ociosos. A primeira requisição depois disso demora, e a interface precisa tolerar isso.

CI/CD fica para depois de a API estar de pé.

## Sistema visual

Direção **B, "modernista didático"**. A fonte da verdade é `design/tokens.css`.

Rampas de cor fechadas, com nome de coisa de escola:

| Rampa | Cor | Papel |
|---|---|---|
| Caneta | índigo de tinta | identidade e seleção |
| Mimeógrafo | terracota queimada | exclusiva da ação principal |
| Régua | dourado empoeirado | destaque e metodologia |
| Tinta | neutros quentes | texto, traço, superfície (papel `#F2F0EC`) |
| Sinal | ok, erro, aviso | estado de sistema, fora da identidade |

Componentes consomem apenas os tokens semânticos. Trocar tema é trocar um bloco.

Artefatos em `design/`: `planoteca-sistema.html` (guia visual), `planoteca-direcoes.html` (as direções exploradas), `*.dc.html` (artboards), telas aprovadas em PNG.

## Estado atual

O que está de pé:

- Sistema visual definido e aplicado em `tema.css`
- Entidade `plano` completa (modelo, mapeador, api, hook `useFiltroPlanos`)
- Landing page pública com atalhos por componente e por ano
- Biblioteca pública com filtros, `FichaPlano`, `Chip` e `CampoBusca`
- Navegação das três áreas (Início · Biblioteca · Blog) em casca própria
- Guia de estilo com os componentes catalogados
- API em PostgreSQL 16, com snake_case
- 175 testes de front passando, lint e build verdes; 10 testes de API passando

Lacunas abertas, herdadas do boilerplate ou ainda não implementadas:

1. **Não existe autenticação no back-end.** `POST /api/v1/auth/login` e `GET /api/v1/auth/userinfo` estão no contrato, e o front já escreve contra eles. Nenhum controller os implementa: contra a API real, o login devolve 404. Use a simulação MSW para desenvolver a interface.
2. **A API não tem nenhum controller.** A fatia de exemplo `PersonSample` saiu na migração para PostgreSQL. O SQL Dapper dela era T-SQL puro, e ela nunca foi domínio da Planoteca.
3. **O endpoint de planos ainda não existe.** A Biblioteca consome mocks MSW. Quando ele nascer, **não** leva `[Authorize]`: o acervo é público.
4. **Login com Google ainda não foi ligado.** O formulário atual é usuário e senha, herdado do boilerplate.
5. **Não há migration versionada.** Rode `dotnet ef migrations add Inicial` antes do primeiro `database update`.
6. **O Blog é só uma rota com página de "em breve".** Sem entidade, sem endpoint, sem moderação.
7. **O painel administrativo não começou.** Quem entra hoje cai em `/pessoas`, que ainda é andaime de boilerplate.

## Convenção de commit

Conventional Commits: `<tipo>(<escopo>): <descrição>`

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Exemplo: `feat(plano): adiciona filtro por metodologia`.

## Tom

Projeto de professor para professor. Feito com cuidado, sem verniz de startup. Fala com o usuário como colega, não como cliente. Isso vale para a interface, para o texto do produto e para esta documentação.

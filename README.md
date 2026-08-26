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

Desenho de 2026-08-26: hero com foto de sala de aula e busca que cai direto na Biblioteca (`?q=`); quatro cards de área do conhecimento (Linguagens, Matemática, Ciências da Natureza, Ciências Humanas) que, ao passar o mouse, receber foco ou tocar, abrem os componentes de cada área com o filtro já aplicado; régua de séries; faixa do Blog; rodapé com navegação e contato (`planoteca.escola@gmail.com`). As áreas e os componentes vêm do vocabulário da API — um componente cadastrado no painel aparece no card certo sem deploy. Continua sem depoimento, contador e newsletter.

### Biblioteca

O coração do produto. Listagem de planos com filtros por série, componente curricular, metodologia ativa, duração e código BNCC, mais busca por texto.

Cada plano tem página própria: objetivos de aprendizagem, materiais necessários, códigos BNCC e botão de download. Sem login, sem cadastro, sem espera.

### Blog

Área editorial e colaborativa. Textos, relatos de sala de aula e dicas escritos pelos próprios professores.

Qualquer professor cadastrado escreve. O texto entra como pendente e vai ao ar só depois da aprovação de um administrador. Moderação simples: publicar, devolver com comentário, ou recusar.

## Contas e permissões

Login com **conta Google ou e-mail e senha**, pelo Firebase Authentication. A senha é
guardada pelo Firebase; não há hash no nosso banco.

O Firebase prova quem é a pessoa. O **papel** — professor ou administrador — mora na coluna
`pessoa.papel`, e o `PapelClaimsMiddleware` o injeta como claim. Papel nunca vira custom
claim do Firebase. O console dele é um lugar onde alguém altera permissão sem revisão.

O primeiro administrador nasce por SQL. Todo cadastro nasce professor, e não existe caminho
de código que crie um administrador.

| Papel | Pode |
|---|---|
| **Visitante** (sem conta) | Navegar, filtrar, buscar, baixar qualquer plano |
| **Professor** | Tudo do visitante, mais escrever textos do blog e acompanhar o status do que enviou |
| **Administrador** | Tudo do professor, mais moderar o blog, catalogar planos, gerir o vocabulário e o acesso das contas |

## Painel administrativo

Mesa de trabalho, não painel de métricas. Mostra primeiro o que precisa de atenção: textos aguardando aprovação.

| Tela | O que faz |
|---|---|
| Moderação | fila do blog: publicar, devolver com comentário, recusar, arquivar |
| Planos | gestão do acervo publicado |
| Catalogar | upload do PDF mais os campos de catalogação |
| Vocabulário | cadastro de componente, série e metodologia |
| Escrever | redação de texto do blog, aberta a qualquer professor |
| Pessoas | papel e acesso de quem se cadastrou |

O formulário de catalogação será preenchido dezenas de vezes seguidas na fase de povoamento.
É otimizado para repetição, não para a primeira vez.

A tela de Vocabulário existe porque componente, série e metodologia são **dados**, não lista
fechada em código. Sem ela, cada componente novo custaria um `INSERT` manual no banco.

---

# Especificação técnica

## Estrutura do repositório

```
Planoteca/
├── planoteca-api/     back-end .NET 10, Clean Architecture
├── planoteca-web/     front-end React 19 + Vite
├── design/            sistema visual: tokens, direções, telas aprovadas
└── Docs/              todo.md, lessons.md, specs/, plans/, guias/
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
├── entities/     domínio (plano, post, vocabulario, conta, autenticacao)
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
| `LayoutPublico` | `/`, `/biblioteca`, `/biblioteca/:id`, `/blog`, `/blog/:id` | nenhuma |
| `Shell` | `/admin/*` e `/pessoas` | `RotaProtegida` |

O acervo é público: navegar, filtrar e baixar não passam por guarda nenhuma.

Login leva para a área de trabalho, não para a Biblioteca. Quem se identifica na
Planoteca é quem vai escrever ou catalogar.

Dois testes travam a regra: `src/app/rotas/guarda.test.tsx`, no bloco "o acervo é
público", e `e2e/biblioteca.spec.ts`, que filtra e pagina sem login.

### Domínio de plano

Componente, série e metodologia são **tabela no banco**, servidas por
`GET /api/v1/vocabulary`. Até 2026-08-22 eram unions fechados em TypeScript, com a cor
escrita ao lado. O compilador recusava um componente sem cor.

O acervo real derrubou isso. Os relatos da SEDU trazem Química, Física e Biologia, e 2ª e 3ª
série do Ensino Médio. Fechar o vocabulário em código custaria um deploy a cada
componente novo. Quem povoa a Planoteca administra o acervo, e não escreve código.

O que se perdeu com a troca foi a garantia em tempo de compilação. Duas defesas substituem o
compilador: `cor` e `sigla` são `NOT NULL` no banco, e `classeCorComponente()` tem fallback
neutro.

**A cor continua fechada**, e é a única parte que não virou dado livre. O Tailwind gera
utilitário varrendo o fonte por texto literal. Uma classe montada em tempo de execução não
existe no CSS final.

São quatro tokens de área: `comp-linguagens`, `comp-matematica`, `comp-natureza` e
`comp-humanas`. Eles moram em dois lugares que precisam concordar — `CorComponente.cs` na
API e `CORES_COMPONENTE` em `modelo.ts`.

A **ordem** de série e componente é calculada pela API, nunca digitada. `serie.ordem` é
`UNIQUE` no banco: pedir o número a quem cadastra é pedir que ele adivinhe qual está livre.

O código BNCC é obrigatório, porque a busca por código é o caminho principal de quem chega ao
acervo.

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

Versões de pacote são centralizadas em `Directory.Packages.props`. Não escreva versão em `.csproj`.

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

A API registra um servidor Model Context Protocol em `/mcp` (`Program.cs:81`), **sem nenhuma
ferramenta publicada até agora**. A pasta `Api/McpTools/` não existe.

Quando a primeira nascer, ela vai lá e é descoberta por reflexão (`WithToolsFromAssembly()`).
Uma ferramenta MCP nunca reimplementa regra de negócio: ela injeta o mesmo app service do
controller.

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

O deploy passa pelo **GitHub Actions**, não pelo webhook do Render. O
`.github/workflows/ci.yml` roda o portão dos dois lados e só então chama o Deploy Hook. O
webhook nativo nunca disparou neste repositório, e a troca vale por si: nada sobe sem o
portão passar.

O schema é aplicado no arranque da API. `Program.cs` chama `MigrateAsync()` antes de aceitar
tráfego, porque o Render não oferece passo de release onde rodar `dotnet ef database update`.

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

`design/tokens.css` é a fonte da verdade. `planoteca-web/src/app/estilos/tema.css` traduz
esses valores para a estrutura do Tailwind v4 e do shadcn. É esse segundo arquivo que o
`verifica-tokens.mjs` cobra.

Artefatos em `design/`: `planoteca-sistema.html` (guia visual), `planoteca-direcoes.html` (as direções exploradas), `*.dc.html` (artboards), telas aprovadas em PNG.

## Estado atual

Estado de 2026-08-24.

### O que está de pé

**Acervo público**

- Landing, Biblioteca com filtros e paginação, ficha de plano, download do PDF
- Ligado à API real: a Biblioteca lê `GET /api/v1/lesson-plans`, e o PDF vem do R2
- Nenhuma dessas telas passa por guarda, e dois testes travam a regra

O MSW simula a rede **só nos testes**. Não existe `setupWorker`, então nada de mock entra
no que roda em produção.

**Blog**

- Escrita por qualquer professor, com editor de texto rico e sanitização
- Moderação completa: publicar, devolver com comentário, recusar, arquivar
- Contador de visualizações

**Painel administrativo**

- Seis telas: Moderação, Planos, Catalogar, Vocabulário, Escrever, Pessoas
- Gestão de papel e de acesso, com o primeiro administrador nascendo por SQL

**API**

| Controller | Rota | Acesso |
|---|---|---|
| `AuthController` | `/api/v1/auth` | `GET /me` autenticado |
| `LessonPlansController` | `/api/v1/lesson-plans` | anônimo |
| `VocabularyController` | `/api/v1/vocabulary` | anônimo |
| `PostsController` | `/api/v1/posts` | anônimo |
| `AdminLessonPlansController` | `/api/v1/admin/lesson-plans` | administrador |
| `AdminVocabularyController` | `/api/v1/admin/vocabulary` | administrador |
| `AdminPostsController` | `/api/v1/admin/posts` | autenticado, moderação restrita |
| `AdminPessoasController` | `/api/v1/admin/people` | administrador |

**Infraestrutura**

- Firebase Authentication ligado dos dois lados
- Três migrations versionadas, aplicadas no arranque por `MigrateAsync()`
- Deploy pelo GitHub Actions, que roda o portão dos dois lados antes do Deploy Hook
- Front no ar em `planoteca-theta.vercel.app`

**Portão**

- 66 testes de API, 235 de front, 12 de ponta a ponta
- `lint`, `build` e o verificador de tokens verdes

### O que falta

1. **`/pessoas` é andaime de boilerplate.** A fatia `pessoa` no front
   (`src/entities/pessoa`, `src/features/filtrar-pessoas`, `src/pages/pessoas`) não é domínio
   da Planoteca. O padrão a copiar é `entities/plano`.
2. **`Api/Policies/` é código morto** herdado do boilerplate, não registrado em lugar nenhum.
3. **Domínio próprio.** Ainda no subdomínio da Vercel.
4. **Contagem de planos afetados ao desativar vocabulário.** Hoje o diálogo dá um aviso
   genérico. O número real exige rota nova.

## Convenção de commit

Conventional Commits: `<tipo>(<escopo>): <descrição>`

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Exemplo: `feat(plano): adiciona filtro por metodologia`.

## Tom

Projeto de professor para professor. Feito com cuidado, sem verniz de startup. Fala com o usuário como colega, não como cliente. Isso vale para a interface, para o texto do produto e para esta documentação.

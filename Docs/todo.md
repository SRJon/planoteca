# Planoteca — projetos a partir do boilerplate

## Feito

- [x] Gerar back-end `planoteca-api` a partir de `boilerplate/saraivatech-api`
- [x] Gerar front-end `planoteca-web` a partir de `boilerplate/saraivatech-web`

## Camada visual — Direção B ("modernista didático")

Fonte da verdade: `design/tokens.css`. Tela de referência: `design/DirecaoB.dc.html`.

- [ ] Portar tokens da Direção B para `planoteca-web/src/app/estilos/tema.css`
  - paleta caneta/mimeógrafo/régua/tinta, três famílias tipográficas
  - raio ~0, traço 2px, sem sombra difusa
  - cores de componente curricular como tokens `--color-comp-*`
- [ ] Atualizar `tokensReferencia.ts` (o teste da style guide compara token a token)
- [ ] Trocar a `Marca` pelo símbolo da Direção B (três formas geométricas)
- [ ] Tela Biblioteca: entidade `plano`, feature de filtro, página, rota
- [ ] Gates: `npm run lint`, `typecheck`, `test`, `build`

## Migração para PostgreSQL + acervo público (2026-08-22)

Referência da migração: projeto irmão Farol (`DEV/Farol/csc-farol-api-dotnet`).

### API — PostgreSQL

- [x] Trocar `Microsoft.EntityFrameworkCore.SqlServer` por `Npgsql.EntityFrameworkCore.PostgreSQL` 10.0.2
- [x] Acrescentar `EFCore.NamingConventions` 10.0.1 e `.UseSnakeCaseNamingConvention()`
- [x] Subir EF Core de 10.0.0 para 10.0.4 (o Npgsql 10.0.2 exige)
- [x] `SqlConnection` → `NpgsqlConnection` (Dapper)
- [x] `UseNpgsql` no runtime e no design-time, com aviso de sincronia nos dois
- [x] `DefaultTypeMap.MatchNamesWithUnderscores = true` em `Program.cs`
- [x] Remover a fatia `PersonSample` (16 arquivos) — o SQL Dapper dela era T-SQL puro
- [x] `docker-compose.yml`: `postgres:16`, healthcheck, credenciais via `.env`
- [x] Connection string de dev e `.env.template`
- [x] Gates: `dotnet build` e `dotnet test` (10 testes)

### Front — o acervo deixa de exigir login

- [x] `LayoutPublico`: barra superior Início · Biblioteca · Blog, botão Entrar
- [x] `PaginaInicio`: landing com atalhos por componente e por ano
- [x] `PaginaBlog`: placeholder honesto, sem simular lista vazia
- [x] `Rotas.tsx`: acervo fora de `RotaProtegida`, curinga aponta para `/`
- [x] Pós-login vai para a área de trabalho, não para a Biblioteca
- [x] `CLASSE_BLOCO_COMPONENTE` movido de `FichaPlano` para `entities/plano`
- [x] Testes novos travando a regra "o acervo é público"
- [x] `e2e/biblioteca.spec.ts` filtra e pagina sem nunca fazer login

### Fica para depois

- [ ] Login com Google (hoje é usuário e senha do boilerplate)
- [ ] Entidade `Plano` na API e `GET /api/v1/lesson-plans` — **sem `[Authorize]`**
- [ ] `dotnet ef migrations add Inicial`
- [ ] Blog de verdade: entidade, listagem, escrita, moderação
- [ ] Painel administrativo, e aposentar `/pessoas`

## Modelo de domínio no banco (2026-08-22)

Spec: `docs/specs/2026-08-22-modelo-dominio.html`. Plano: `docs/plans/2026-08-22-modelo-dominio.md`.

- [x] Entidades de vocabulário: Serie, Componente, Metodologia
- [x] Entidades do acervo: Plano, EtapaPlano, Bncc e as três ligações N:N
- [x] Pessoa, Post e as enumerações de papel e situação
- [x] Mapeamentos Fluent API das onze tabelas
- [x] Migration `Inicial` com seed de 41 metodologias, 7 séries e 13 componentes
- [x] Índice único parcial que garante um componente principal por plano
- [x] 15 testes novos de domínio e de seed (total da API: 25)
- [x] Migration aplicada em PostgreSQL 16.14 real, com o relato do Termoscópio gravado e lido

Corrigido no caminho, fora do escopo previsto:

- [x] `DatabaseContextFactory` lia só `appsettings.json` e não achava a connection string
- [x] `appsettings.Local.json` não estava no `.gitignore`, apesar de o CLAUDE.md afirmar que sim
- [x] Projeto de teste não referenciava `Infra.Data`

## Camada de acesso (2026-08-22, em curso)

- [x] `IPlanoRepository` com `FiltroPlano`: busca textual, componente, série, metodologia, duração
- [x] `PlanoRepository` em LINQ do EF, com `ILIKE` do Postgres
- [x] `IVocabularioRepository` e implementação — as três listas numa interface
- [x] Registro dos dois no `DependencyInjectionBootStrapper`
- [x] 8 testes de integração contra PostgreSQL real, com `SkippableFact`
- [x] `PlanoValidator` e `PostValidator` (FluentValidation, RuleSets)
- [x] `IArmazenamentoArquivo` + `ArmazenamentoR2` (URL pré-assinada) + substituto que falha alto
- [x] DTOs, `VocabularioMapper` (Mapperly) e `PlanoMapper` (à mão, achata N:N)
- [x] `PlanoAppService` e `VocabularioAppService`
- [x] `LessonPlansController` e `VocabularyController` — **sem `[Authorize]`**
- [x] Verificado com a API no ar: 8 filtros, ficha, rascunho invisível, `X-Total-Count`
- [x] Corrigido: `Program.cs` não carregava `appsettings.Local.json`

## Front consome o vocabulário da API (2026-08-22)

- [x] Decidido: **Vercel** para o front (fallback de SPA de fábrica, preview por PR)
- [x] Entidade `entities/vocabulario` — modelo, api, `useVocabulario` com cache de 1h
- [x] `entities/plano` no contrato novo; `mapeador.ts` removido (a API já fala domínio)
- [x] Tokens de cor por **área** no `tema.css` — quatro, não oito por componente
- [x] `useFiltroPlanos` filtra por id, com série e metodologia
- [x] `FiltrosPlanos`, `FichaPlano`, `PaginaBiblioteca` e `PaginaInicio` na API
- [x] Fixtures e handlers MSW/Playwright no contrato novo
- [x] Testes novos: componente secundário, plano em duas séries, ferramenta fora do filtro

## Ficha do plano (2026-08-22)

- [x] `GET /lesson-plans/{id}` tratado: 404 vira `null`, não erro
- [x] `PaginaPlano` em `/biblioteca/:id` — objetivo, expectativas, recursos e roteiro numerado
- [x] Card leva à ficha pelo título (o card inteiro não, para não engolir o download)
- [x] Handlers de detalhe em MSW e Playwright
- [x] 7 testes de unidade e 1 e2e do caminho card → ficha → download

## Endpoints de catalogação (2026-08-22)

- [x] `POST /admin/lesson-plans/upload-url` — assina a URL do R2
- [x] `POST /admin/lesson-plans` — cataloga, normaliza ordem das etapas
- [x] Erros usam o modelo `Error` do projeto (objeto anônimo virava "An error occurred.")
- [x] Verificado com a API no ar: 201, leitura de volta, e as duas validações

**`[AllowAnonymous]` no controller admin é temporário.** Está escrito de forma
explícita para a troca por `[Authorize(Policy = "Administrador")]` ser uma linha
visível no diff quando o login nascer.

## Painel de catalogação (2026-08-22)

- [x] `entities/plano/apiAdmin.ts` — assinar, subir ao R2, catalogar
- [x] `useCatalogarPlano` — os três passos, com o estado de cada um
- [x] `FormularioCatalogar` — fluxo vertical único, chips do mesmo gesto do filtro
- [x] `CampoArquivo` em `components/ui`, catalogado no guia de estilo
- [x] Rota `/admin/catalogar` dentro do `Shell`, com item de menu
- [x] Handlers de admin em MSW (upload assinado, `PUT` no R2, catalogação)
- [x] 8 testes de unidade
- [x] **Corrigido no tema:** `--color-input` apontava para `--campo` (branco),
      e o shadcn a usa como cor de BORDA — todo `Input`, `Textarea` e `Select`
      do projeto ficava sem moldura visível

**Otimizado para repetição:** ao concluir, série, componente, metodologia e
modalidade PERMANECEM; só o que é único do plano é limpo.

### Dívida registrada

- [ ] Arquivo órfão no R2 quando a catalogação falha depois do upload. A troca
      é consciente (a alternativa seria a API mediar o upload, que não cabe no
      Render gratuito). Precisa de uma rotina de limpeza.

## Blog na API (2026-08-22)

- [x] `IPostRepository` + `PostRepository` — listagem por situação, busca, fila
- [x] `PostAppService` — escrever (nasce pendente) e moderar
- [x] `PostsController` público (só publicados) e `AdminPostsController`
- [x] Verificado com a API no ar: escrever → invisível → devolver sem motivo
      recusado (RF-11) → devolver com motivo → publicar → visível

## Deploy (2026-08-22)

- [x] `Dockerfile` corrigido: o caminho do projeto não batia com `src/`, e
      faltava respeitar a `PORT` que o Render injeta
- [x] Camadas de `restore` separadas do código, para o build de CI não refazer
      tudo a cada alteração
- [x] **Verificado:** `docker run -e PORT=10000` responde na porta injetada e
      serve o vocabulário completo (13 componentes, 7 séries, 41 metodologias)
- [x] `render.yaml` na raiz, sem nenhum segredo — chaves `sync: false`
- [x] `planoteca-web/vercel.json` com o rewrite de SPA

## Blog e painel no front (2026-08-22)

- [x] `entities/post` — modelo, api, hooks (listar, ler, moderar, contar)
- [x] `PaginaBlog` e `PaginaPost` públicas, em `/blog` e `/blog/:id`
- [x] `PaginaModeracao` — fila por situação, leitura em linha, decisão
- [x] `PaginaEscrever` — formulário, mais o que a pessoa enviou e o que voltou
- [x] `PaginaPlanos` — gestão do acervo, com rascunho e publicado juntos
- [x] Menu do painel com as quatro telas; `Pessoas` saiu (era andaime)
- [x] Endpoints novos na API: listar admin, alterar situação, remover
- [x] Handlers em MSW e Playwright; 21 testes de unidade e 3 e2e novos

### Fechado nesta leva

O produto está completo em relação ao briefing:

| Área | Estado |
|---|---|
| Início, Biblioteca, Blog | as três abas, públicas |
| Ficha do plano | objetivos, recursos, roteiro, download |
| Ficha do texto | leitura pública |
| Painel: moderação | fila, leitura, publicar/devolver/recusar |
| Painel: planos | publicar, despublicar, remover rascunho |
| Painel: catalogar | formulário otimizado para repetição |
| Painel: escrever | com o retorno da moderação |

## Login com Firebase (2026-08-23)

- [x] `google_sub` renomeado para `firebase_uid` (migration `RenameColumn`)
- [x] `SessaoAppService` — resolve o token na pessoa, cria no primeiro acesso
- [x] `PapelClaimsMiddleware` — injeta `papel` e `pessoaId` do NOSSO banco
- [x] Política `Administrador`, registrada mesmo sem Firebase configurado
- [x] `GET /auth/me` — quem sou eu, na Planoteca
- [x] `[Authorize]` nas rotas admin; ids saíram do corpo da requisição
- [x] `AutenticacaoProvider` com `onIdTokenChanged` — a sessão deixa de vencer
- [x] `PaginaEntrar` com Google e e-mail/senha, erros traduzidos
- [x] Menu filtra por PAPEL, não mais por grupo de diretório
- [x] Fatia `entities/sessao` e `features/autenticar` removidas
- [x] Verificado com a API no ar: 401 em tudo que é admin, público intacto

### Decisões

- **Provedores:** Google **e** e-mail/senha. Revisa o "só Google" do briefing.
- **Primeiro administrador:** por SQL. Todo cadastro nasce professor.
- **Papel nunca em custom claim** do Firebase: o console dele altera permissão
  sem revisão.

### Corrigido no caminho

- `RotaProtegida` perdia o destino ao redirecionar. Agora o caminho pedido
  viaja no `state`, e a tela de entrar devolve a pessoa a ele.

### Próximo ciclo

- [ ] Serviços de domínio, app services e mappers do Mapperly
- [ ] Controllers e o contrato REST — `GET /lesson-plans` **sem** `[Authorize]`
- [ ] `GET /api/v1/vocabulary` e a troca do union por dado no front (RF-09)
- [ ] Formulário de catalogação, otimizado para repetição
- [ ] Login com Google, e só então `[Authorize]` nas rotas de escrita

## Revisão

(preencher ao final)
